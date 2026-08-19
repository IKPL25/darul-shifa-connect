-- 1. Booking user account table
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.app_users TO authenticated;
GRANT ALL ON public.app_users TO service_role;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own account" ON public.app_users
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users create own account" ON public.app_users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own account" ON public.app_users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff read all accounts" ON public.app_users
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Backfill accounts from existing patient rows
INSERT INTO public.app_users (id, google_email, created_at, last_login_at)
SELECT DISTINCT ON (user_id) user_id, google_email, created_at, last_login_at
FROM public.patients
ON CONFLICT (id) DO NOTHING;

-- 2. patients: many patients per booking user
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_user_id_key;
ALTER TABLE public.patients ALTER COLUMN cnic DROP NOT NULL;
ALTER TABLE public.patients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_self boolean NOT NULL DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS relation text;

UPDATE public.patients SET is_self = true WHERE is_self = false;

CREATE INDEX IF NOT EXISTS patients_mobile_idx ON public.patients (mobile);
CREATE INDEX IF NOT EXISTS patients_user_id_idx ON public.patients (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS patients_one_self_per_user_idx
  ON public.patients (user_id) WHERE is_self;

-- Allow the owner to remove a patient record they created (only when no MR assigned)
GRANT DELETE ON public.patients TO authenticated;
CREATE POLICY "Owners delete own unassigned patients" ON public.patients
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND mr_number IS NULL);

-- 3. updated_at + MR protection stays; add same guard for app_users
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_users_touch_trg ON public.app_users;
CREATE TRIGGER app_users_touch_trg BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
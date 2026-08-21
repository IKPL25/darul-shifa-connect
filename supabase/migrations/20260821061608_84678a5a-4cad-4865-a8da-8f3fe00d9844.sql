-- ============ permissions helper ============
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);
GRANT SELECT ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own permissions" ON public.admin_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'master_admin'));

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'master_admin')
      OR EXISTS (
        SELECT 1 FROM public.admin_permissions ap
        WHERE ap.user_id = _user_id AND ap.permission = _permission
          AND public.has_role(_user_id, 'admin')
      )
$$;

-- ============ specialties ============
CREATE TABLE public.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ur text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX specialties_name_unique ON public.specialties (lower(name));
GRANT SELECT, INSERT, UPDATE ON public.specialties TO authenticated;
GRANT ALL ON public.specialties TO service_role;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads active specialties" ON public.specialties
  FOR SELECT TO authenticated USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "Permitted staff create specialties" ON public.specialties
  FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'manage_specialties'));
CREATE POLICY "Permitted staff update specialties" ON public.specialties
  FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'manage_specialties'))
  WITH CHECK (public.has_permission(auth.uid(), 'manage_specialties'));
CREATE TRIGGER specialties_touch_trg BEFORE UPDATE ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ doctors ============
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  specialty_name text NOT NULL,
  qualification text NOT NULL DEFAULT '',
  days smallint[] NOT NULL DEFAULT '{}',
  opd_timing text NOT NULL DEFAULT '',
  fee integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX doctors_active_idx ON public.doctors (is_active);
CREATE INDEX doctors_specialty_idx ON public.doctors (specialty_id);
GRANT SELECT, INSERT, UPDATE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads active doctors" ON public.doctors
  FOR SELECT TO authenticated USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "Permitted staff create doctors" ON public.doctors
  FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'add_doctor'));
CREATE POLICY "Permitted staff update doctors" ON public.doctors
  FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'edit_doctor'))
  WITH CHECK (public.has_permission(auth.uid(), 'edit_doctor'));
CREATE TRIGGER doctors_touch_trg BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ appointments ============
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number text NOT NULL UNIQUE,
  booking_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_email text NOT NULL DEFAULT '',
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  patient_name text NOT NULL,
  guardian_name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  mobile text NOT NULL,
  mr_number text,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  doctor_name text NOT NULL,
  specialty_name text NOT NULL,
  qualification text NOT NULL DEFAULT '',
  appointment_date date NOT NULL,
  opd_timing text NOT NULL DEFAULT '',
  fee integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'created',
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appointments_user_idx ON public.appointments (booking_user_id);
CREATE INDEX appointments_date_idx ON public.appointments (appointment_date);
CREATE INDEX appointments_doctor_idx ON public.appointments (doctor_id);
CREATE INDEX appointments_mobile_idx ON public.appointments (mobile);
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking user reads own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (auth.uid() = booking_user_id);
CREATE POLICY "Staff read all appointments" ON public.appointments
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Booking user creates own appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = booking_user_id
    AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Permitted staff update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'manage_appointments'))
  WITH CHECK (public.has_permission(auth.uid(), 'manage_appointments'));
CREATE TRIGGER appointments_touch_trg BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Appointment number generator: DSH-YYYYMMDD-001, unique per day.
CREATE OR REPLACE FUNCTION public.next_appointment_number(_date date)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prefix text := 'DSH-' || to_char(_date, 'YYYYMMDD') || '-';
  seq int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(prefix));
  SELECT COALESCE(MAX(NULLIF(regexp_replace(appointment_number, '^.*-', ''), '')::int), 0) + 1
    INTO seq
  FROM public.appointments
  WHERE appointment_number LIKE prefix || '%';
  RETURN prefix || lpad(seq::text, 3, '0');
END;
$$;
GRANT EXECUTE ON FUNCTION public.next_appointment_number(date) TO authenticated;

-- Seed the hospital's starting specialties.
INSERT INTO public.specialties (name, name_ur) VALUES
  ('Child Specialist', 'ماہرِ اطفال'),
  ('General Physician', 'جنرل فزیشن'),
  ('Gynecologist', 'ماہرِ امراضِ نسواں'),
  ('Sonologist', 'ماہرِ الٹراساؤنڈ'),
  ('Skin Specialist', 'ماہرِ جلد'),
  ('Neurologist', 'ماہرِ اعصاب'),
  ('Dentist', 'ماہرِ دندان'),
  ('General Surgeon', 'جنرل سرجن');
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { patientProfileSchema, mrRegex } from "@/lib/patient-schema";

const PATIENT_COLUMNS =
  "id, user_id, full_name, guardian_name, age, gender, mobile, mr_number, is_self, relation, created_at, updated_at";

/** The signed-in Google account (booking user). Created/refreshed on each visit. */
export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string })?.email ?? "";
    const now = new Date().toISOString();
    const { data } = await context.supabase
      .from("app_users")
      .select("id, google_email, created_at, last_login_at")
      .eq("id", context.userId)
      .maybeSingle();

    if (!data) {
      const { data: created } = await context.supabase
        .from("app_users")
        .insert({ id: context.userId, google_email: email })
        .select("id, google_email, created_at, last_login_at")
        .maybeSingle();
      return { account: created ?? { id: context.userId, google_email: email, created_at: now, last_login_at: now } };
    }
    await context.supabase.from("app_users").update({ last_login_at: now }).eq("id", context.userId);
    return { account: data };
  });

/** All patient records this Google account has created (self + family members). */
export const listMyPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .eq("user_id", context.userId)
      .order("is_self", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error("PROFILE_LOAD_FAILED");
    return { patients: data ?? [] };
  });

const savePatientInput = z.object({
  id: z.string().uuid().optional(),
  is_self: z.boolean().default(false),
  relation: z.string().trim().max(20).optional(),
  ...patientProfileSchema.shape,
});

/** Create or update a patient record owned by this Google account. MR number is never accepted here. */
export const savePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => savePatientInput.parse(input))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string })?.email ?? "";
    const { id, ...fields } = data;

    if (id) {
      const { error } = await context.supabase
        .from("patients")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", context.userId);
      if (error) throw new Error("PROFILE_SAVE_FAILED");
      return { ok: true, id };
    }

    // Identify an existing patient of this account by mobile to avoid duplicates.
    const { data: existing } = await context.supabase
      .from("patients")
      .select("id")
      .eq("user_id", context.userId)
      .eq("mobile", fields.mobile)
      .eq("full_name", fields.full_name)
      .maybeSingle();
    if (existing) return { ok: true, id: existing.id, matchedExisting: true };

    const { data: inserted, error } = await context.supabase
      .from("patients")
      .insert({ ...fields, user_id: context.userId, google_email: email })
      .select("id")
      .maybeSingle();
    if (error) throw new Error("PROFILE_SAVE_FAILED");
    return { ok: true, id: inserted?.id ?? null };
  });

/** Remove one of my patient records (only before an MR number is issued). */
export const deleteMyPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("patients")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("mr_number", null);
    if (error) throw new Error("DELETE_FAILED");
    return { ok: true };
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role as string);
    return {
      isMaster: roles.includes("master_admin"),
      isStaff: roles.includes("admin") || roles.includes("master_admin"),
    };
  });

/** Find a hospital record among the patients this account owns, by mobile or MR number. */
export const findMyRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ term: z.string().trim().min(3).max(30) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .eq("user_id", context.userId);
    if (error) throw new Error("SEARCH_FAILED");
    const term = data.term.replace(/-/g, "").toLowerCase();
    const match =
      (rows ?? []).find(
        (row) =>
          (row.mobile ?? "").replace(/-/g, "").toLowerCase() === term ||
          (row.mr_number ?? "").replace(/-/g, "").toLowerCase() === term,
      ) ?? null;
    return { patient: match };
  });

async function assertStaff(context: { supabase: { rpc: Function }; userId: string }) {
  const { data } = await (context.supabase as any).rpc("is_staff", { _user_id: context.userId });
  if (!data) throw new Error("FORBIDDEN");
}

/** Staff-only patient search by MR number, mobile or name. */
export const staffSearchPatients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ term: z.string().trim().max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    let query = context.supabase
      .from("patients")
      .select(`${PATIENT_COLUMNS}, google_email`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.term) {
      const term = data.term.replace(/[%,]/g, "");
      query = query.or(`mr_number.ilike.%${term}%,mobile.ilike.%${term}%,full_name.ilike.%${term}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error("SEARCH_FAILED");
    return { patients: rows ?? [] };
  });

/** Staff-only MR number assignment. Unique + permanent, enforced in the database. */
export const assignMrNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ patientId: z.string().uuid(), mrNumber: z.string().trim().regex(mrRegex) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { error } = await context.supabase
      .from("patients")
      .update({ mr_number: data.mrNumber })
      .eq("id", data.patientId)
      .is("mr_number", null);
    if (error) throw new Error(error.code === "23505" ? "MR_DUPLICATE" : "MR_ASSIGN_FAILED");
    return { ok: true };
  });

/** Suggests the next free MR number (staff only). */
export const nextMrNumber = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { data } = await context.supabase
      .from("patients")
      .select("mr_number")
      .not("mr_number", "is", null)
      .order("mr_number", { ascending: false })
      .limit(1);
    const last = data?.[0]?.mr_number as string | undefined;
    const next = last ? Number(last.replace("MR-", "")) + 1 : 1;
    return { mrNumber: `MR-${String(next).padStart(6, "0")}` };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { patientProfileSchema, mrRegex } from "@/lib/patient-schema";

const PATIENT_COLUMNS =
  "id, google_email, full_name, guardian_name, age, gender, mobile, cnic, address, mr_number, created_at, updated_at, last_login_at";

/** Current user's patient record (null when they have not registered yet). */
export const getMyPatient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("PROFILE_LOAD_FAILED");
    if (data) {
      await context.supabase
        .from("patients")
        .update({ last_login_at: new Date().toISOString() })
        .eq("user_id", context.userId);
    }
    return { patient: data ?? null };
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

/** Create or update the signed-in patient's own profile. MR number is never accepted here. */
export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => patientProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string })?.email ?? "";
    const { data: existing } = await context.supabase
      .from("patients")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase
        .from("patients")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("user_id", context.userId);
      if (error) throw new Error("PROFILE_SAVE_FAILED");
    } else {
      const { error } = await context.supabase.from("patients").insert({
        ...data,
        user_id: context.userId,
        google_email: email,
      });
      if (error) throw new Error("PROFILE_SAVE_FAILED");
    }
    return { ok: true };
  });

/** Look up the signed-in patient's own hospital record by mobile or MR number. */
export const findMyRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ term: z.string().trim().min(3).max(30) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("patients")
      .select(PATIENT_COLUMNS)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("SEARCH_FAILED");
    const term = data.term.replace(/-/g, "").toLowerCase();
    const matches =
      row &&
      ((row.mobile ?? "").replace(/-/g, "").toLowerCase() === term ||
        (row.mr_number ?? "").replace(/-/g, "").toLowerCase() === term);
    return { patient: matches ? row : null };
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
    let query = context.supabase.from("patients").select(PATIENT_COLUMNS).order("created_at", { ascending: false }).limit(50);
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

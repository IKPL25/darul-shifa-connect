import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { doctorSchema, specialtySchema } from "@/lib/doctor-schema";

const DOCTOR_COLUMNS =
  "id, name, specialty_id, specialty_name, qualification, days, opd_timing, fee, is_active, created_at";

async function assertPermission(context: { supabase: any; userId: string }, permission: string) {
  const { data } = await context.supabase.rpc("has_permission", {
    _user_id: context.userId,
    _permission: permission,
  });
  if (!data) throw new Error("FORBIDDEN");
}

/** Which management actions the signed-in staff member may perform. */
export const getMyPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roleList = (roles ?? []).map((r) => r.role as string);
    const isMaster = roleList.includes("master_admin");
    const isStaff = isMaster || roleList.includes("admin");
    const { data: perms } = await context.supabase
      .from("admin_permissions")
      .select("permission")
      .eq("user_id", context.userId);
    return {
      isMaster,
      isStaff,
      permissions: isMaster ? ["*"] : (perms ?? []).map((p) => p.permission as string),
    };
  });

/** Specialties. Patients see active ones; staff see all. */
export const listSpecialties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("specialties")
      .select("id, name, name_ur, is_active")
      .order("name", { ascending: true });
    if (error) throw new Error("LOAD_FAILED");
    return { specialties: data ?? [] };
  });

export const saveSpecialty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => specialtySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertPermission(context as never, "manage_specialties");
    const { id, ...fields } = data;
    const query = id
      ? context.supabase.from("specialties").update(fields).eq("id", id)
      : context.supabase.from("specialties").insert(fields);
    const { error } = await query;
    if (error) throw new Error(error.code === "23505" ? "DUPLICATE" : "SAVE_FAILED");
    return { ok: true };
  });

/** Doctor list with optional name / specialty / weekday filtering. */
export const listDoctors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        term: z.string().trim().max(80).default(""),
        specialtyId: z.string().uuid().nullish(),
        day: z.number().int().min(0).max(6).nullish(),
        includeInactive: z.boolean().default(false),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase.from("doctors").select(DOCTOR_COLUMNS).order("name");
    if (!data.includeInactive) query = query.eq("is_active", true);
    if (data.term) query = query.ilike("name", `%${data.term.replace(/[%,]/g, "")}%`);
    if (data.specialtyId) query = query.eq("specialty_id", data.specialtyId);
    if (data.day !== null && data.day !== undefined) query = query.contains("days", [data.day]);
    const { data: rows, error } = await query;
    if (error) throw new Error("LOAD_FAILED");
    return { doctors: rows ?? [] };
  });

export const saveDoctor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => doctorSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    await assertPermission(context as never, id ? "edit_doctor" : "add_doctor");
    const { error } = id
      ? await context.supabase.from("doctors").update(fields).eq("id", id)
      : await context.supabase.from("doctors").insert(fields);
    if (error) throw new Error("SAVE_FAILED");
    return { ok: true };
  });

/** Activate / deactivate. Doctors are never deleted so history stays intact. */
export const setDoctorActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context as never, "edit_doctor");
    const { error } = await context.supabase
      .from("doctors")
      .update({ is_active: data.isActive })
      .eq("id", data.id);
    if (error) throw new Error("SAVE_FAILED");
    return { ok: true };
  });

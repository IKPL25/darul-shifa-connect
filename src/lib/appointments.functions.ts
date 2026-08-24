import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APPT_COLUMNS =
  "id, appointment_number, booking_email, patient_id, patient_name, guardian_name, age, gender, mobile, mr_number, doctor_id, doctor_name, specialty_name, qualification, appointment_date, opd_timing, fee, status, payment_status, created_at";

/** Book an appointment for one of my patient records with an active doctor. */
export const createAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        patientId: z.string().uuid(),
        doctorId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string })?.email ?? "";

    const { data: patient } = await context.supabase
      .from("patients")
      .select("id, user_id, full_name, guardian_name, age, gender, mobile, mr_number")
      .eq("id", data.patientId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!patient) throw new Error("PATIENT_NOT_FOUND");

    const { data: doctor } = await context.supabase
      .from("doctors")
      .select("id, name, specialty_name, qualification, days, opd_timing, fee, is_active")
      .eq("id", data.doctorId)
      .maybeSingle();
    if (!doctor || !doctor.is_active) throw new Error("DOCTOR_INACTIVE");

    const picked = new Date(`${data.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(picked.getTime()) || picked <= today) throw new Error("INVALID_DATE");
    if (!(doctor.days ?? []).includes(picked.getDay())) throw new Error("INVALID_DATE");

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: number, error: numberError } = await context.supabase.rpc(
        "next_appointment_number",
        { _date: data.date },
      );
      if (numberError || !number) throw new Error("BOOKING_FAILED");

      const { data: inserted, error } = await context.supabase
        .from("appointments")
        .insert({
          appointment_number: number as string,
          booking_user_id: context.userId,
          booking_email: email,
          patient_id: patient.id,
          patient_name: patient.full_name,
          guardian_name: patient.guardian_name,
          age: patient.age,
          gender: patient.gender,
          mobile: patient.mobile,
          mr_number: patient.mr_number,
          doctor_id: doctor.id,
          doctor_name: doctor.name,
          specialty_name: doctor.specialty_name,
          qualification: doctor.qualification,
          appointment_date: data.date,
          opd_timing: doctor.opd_timing,
          fee: doctor.fee,
          status: "created",
        })
        .select(APPT_COLUMNS)
        .maybeSingle();

      if (!error && inserted) return { appointment: inserted };
      if (error && error.code !== "23505") throw new Error("BOOKING_FAILED");
    }
    throw new Error("BOOKING_FAILED");
  });

/** Every appointment booked from my Google account. */
export const listMyAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("appointments")
      .select(APPT_COLUMNS)
      .eq("booking_user_id", context.userId)
      .order("appointment_date", { ascending: false });
    if (error) throw new Error("LOAD_FAILED");
    return { appointments: data ?? [] };
  });

/** Status lookup restricted to the signed-in booking account's own appointments. */
export const findMyAppointments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ term: z.string().trim().min(3).max(40) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("appointments")
      .select(APPT_COLUMNS)
      .eq("booking_user_id", context.userId)
      .order("appointment_date", { ascending: false });
    if (error) throw new Error("SEARCH_FAILED");
    const term = data.term.replace(/[-\s]/g, "").toLowerCase();
    const matches = (rows ?? []).filter(
      (row) =>
        (row.appointment_number ?? "").replace(/[-\s]/g, "").toLowerCase().includes(term) ||
        (row.mobile ?? "").replace(/[-\s]/g, "").toLowerCase() === term,
    );
    return { appointments: matches };
  });

/** Staff-only appointment list with filters. */
export const staffListAppointments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        term: z.string().trim().max(60).default(""),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
        doctorId: z.string().uuid().nullish(),
        status: z.string().trim().max(20).nullish(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("FORBIDDEN");

    let query = context.supabase
      .from("appointments")
      .select(APPT_COLUMNS)
      .order("appointment_date", { ascending: false })
      .limit(100);
    if (data.date) query = query.eq("appointment_date", data.date);
    if (data.doctorId) query = query.eq("doctor_id", data.doctorId);
    if (data.status) query = query.eq("status", data.status);
    if (data.term) {
      const term = data.term.replace(/[%,]/g, "");
      query = query.or(
        `appointment_number.ilike.%${term}%,patient_name.ilike.%${term}%,mobile.ilike.%${term}%,mr_number.ilike.%${term}%,doctor_name.ilike.%${term}%,specialty_name.ilike.%${term}%`,
      );
    }
    const { data: rows, error } = await query;
    if (error) throw new Error("SEARCH_FAILED");
    return { appointments: rows ?? [] };
  });

/** Staff status update (requires the manage_appointments permission). */
export const setAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["created", "confirmed", "completed", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("has_permission", {
      _user_id: context.userId,
      _permission: "manage_appointments",
    });
    if (!allowed) throw new Error("FORBIDDEN");
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error("SAVE_FAILED");
    return { ok: true };
  });

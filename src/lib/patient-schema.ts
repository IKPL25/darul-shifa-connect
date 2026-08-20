import { z } from "zod";

export const genders = ["male", "female", "other"] as const;
export type Gender = (typeof genders)[number];

export const mobileRegex = /^03\d{2}-?\d{7}$/;
export const mrRegex = /^MR-\d{6}$/;

/** Fields collected for an actual hospital patient (no CNIC, no address). */
export const patientProfileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  guardian_name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(genders),
  mobile: z.string().trim().regex(mobileRegex),
});

export type PatientProfileInput = z.infer<typeof patientProfileSchema>;
export type ProfileField = keyof PatientProfileInput;

/** Returns a map of field -> error key (see i18n `p2.errors`). */
export function validateProfile(values: Record<ProfileField, string>) {
  const errors: Partial<Record<ProfileField, string>> = {};
  if (values.full_name.trim().length < 2) errors.full_name = "required";
  if (values.guardian_name.trim().length < 2) errors.guardian_name = "required";
  const age = Number(values.age);
  if (!values.age.trim() || !Number.isInteger(age) || age < 0 || age > 120) errors.age = "age";
  if (!genders.includes(values.gender as Gender)) errors.gender = "required";
  if (!mobileRegex.test(values.mobile.trim())) errors.mobile = "mobile";
  return errors;
}

import { z } from "zod";

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export const doctorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  specialty_id: z.string().uuid().nullish().transform((v) => v ?? null),
  specialty_name: z.string().trim().min(2).max(120),
  qualification: z.string().trim().max(200).default(""),
  days: z.array(z.number().int().min(0).max(6)).min(1),
  opd_timing: z.string().trim().min(2).max(80),
  fee: z.coerce.number().int().min(0).max(1000000),
  is_active: z.boolean().default(true),
});

export type DoctorInput = z.infer<typeof doctorSchema>;

export const specialtySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  name_ur: z.string().trim().max(80).nullish().transform((v) => v || null),
  is_active: z.boolean().default(true),
});

/** Compact human summary of working days, e.g. "Mon – Sat" or "Mon, Wed, Fri". */
export function formatDays(days: number[], labels: string[]) {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 0) return "—";
  const contiguous = sorted.every((d, i) => i === 0 || d === (sorted[i - 1] as number) + 1);
  if (contiguous && sorted.length > 2) return `${labels[sorted[0] as number]} – ${labels[sorted[sorted.length - 1] as number]}`;
  return sorted.map((d) => labels[d]).join(", ");
}

/** Future dates (excluding today) on which the doctor works, for the next `weeks` weeks. */
export function availableDates(days: number[], weeks = 8) {
  const out: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 1; i <= weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (days.includes(d.getDay())) out.push(toISODate(d));
  }
  return out;
}

export function toISODate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

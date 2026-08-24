import { useLanguage } from "@/lib/i18n";
import { formatDays } from "@/lib/doctor-schema";

export type DoctorRow = {
  id: string;
  name: string;
  specialty_id: string | null;
  specialty_name: string;
  qualification: string;
  days: number[];
  opd_timing: string;
  fee: number;
  is_active: boolean;
};

export function DoctorCard({
  doctor,
  actionLabel,
  onAction,
  children,
}: {
  doctor: DoctorRow;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">{doctor.name}</h3>
          <p className="text-sm font-medium text-primary">{doctor.specialty_name}</p>
          {doctor.qualification && (
            <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            doctor.is_active
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {doctor.is_active ? t.p3.active : t.p3.inactive}
        </span>
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t.p3.availableDays}</dt>
          <dd className="font-medium text-foreground">{formatDays(doctor.days ?? [], t.p3.weekdaysShort)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t.p3.opdTiming}</dt>
          <dd className="font-medium text-foreground" dir="ltr">{doctor.opd_timing || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t.p3.fee}</dt>
          <dd className="font-bold text-destructive" dir="ltr">Rs. {doctor.fee}</dd>
        </div>
      </dl>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 min-h-12 w-full rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
        >
          {actionLabel}
        </button>
      )}
      {children}
    </article>
  );
}

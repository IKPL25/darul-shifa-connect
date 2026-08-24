import { useLanguage } from "@/lib/i18n";

export type AppointmentRow = {
  id: string;
  appointment_number: string;
  booking_email?: string;
  patient_name: string;
  guardian_name: string;
  age: number;
  gender: string;
  mobile: string;
  mr_number: string | null;
  doctor_name: string;
  specialty_name: string;
  qualification: string;
  appointment_date: string;
  opd_timing: string;
  fee: number;
  status: string;
};

export function useStatusLabel() {
  const { t } = useLanguage();
  return (status: string) =>
    status === "confirmed"
      ? t.p3.statusConfirmed
      : status === "cancelled"
        ? t.p3.statusCancelled
        : status === "completed"
          ? t.p3.statusCompleted
          : t.p3.statusCreated;
}

export function AppointmentCard({
  appointment,
  detailed = false,
  children,
}: {
  appointment: AppointmentRow;
  detailed?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const statusLabel = useStatusLabel();

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-extrabold text-destructive" dir="ltr">
          {appointment.appointment_number}
        </p>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {statusLabel(appointment.status)}
        </span>
      </div>
      <h3 className="mt-2 text-base font-bold text-foreground">{appointment.patient_name}</h3>
      <p className="text-sm text-muted-foreground">
        {appointment.doctor_name} · {appointment.specialty_name}
      </p>
      <div className="mt-2 space-y-1 text-sm">
        <Line label={t.p3.appointmentDate} value={appointment.appointment_date} />
        <Line label={t.p3.opdTiming} value={appointment.opd_timing} />
        {detailed && (
          <>
            <Line label={t.p2.relation} value={appointment.guardian_name} />
            <Line label={t.p2.age} value={String(appointment.age)} />
            <Line label={t.p2.gender} value={appointment.gender} />
            <Line label={t.p2.mobile} value={appointment.mobile} />
            <Line label={t.p2.mrNumber} value={appointment.mr_number ?? t.p2.mrPending} />
            <Line label={t.p3.qualification} value={appointment.qualification} />
            <Line label={t.p3.bookingAccount} value={appointment.booking_email ?? "—"} />
            <Line label={t.p3.fee} value={`Rs. ${appointment.fee}`} />
          </>
        )}
      </div>
      {children}
    </article>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium text-foreground" dir="auto">
        {value || "—"}
      </span>
    </div>
  );
}

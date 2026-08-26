import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { AppointmentCard, type AppointmentRow } from "@/components/AppointmentCard";
import { useLanguage } from "@/lib/i18n";
import { getMyPermissions, listDoctors } from "@/lib/doctors.functions";
import { setAppointmentStatus, staffListAppointments } from "@/lib/appointments.functions";

export const Route = createFileRoute("/_authenticated/admin-appointments")({
  head: () => ({
    meta: [
      { title: "Appointment Management | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Staff area to search, filter and manage Darul Shifa General Hospital appointments by date, doctor, patient, mobile, MR or appointment number.",
      },
      { property: "og:title", content: "Appointment Management | Darul Shifa Hospital" },
      { property: "og:description", content: "Search and manage hospital appointments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAppointmentsPage,
});

const STATUSES = ["created", "confirmed", "completed", "cancelled"] as const;

function AdminAppointmentsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fetchPerms = useServerFn(getMyPermissions);
  const fetchDoctors = useServerFn(listDoctors);
  const searchAppointments = useServerFn(staffListAppointments);
  const updateStatus = useServerFn(setAppointmentStatus);

  const [term, setTerm] = useState("");
  const [date, setDate] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const perms = useQuery({ queryKey: ["my-perms"], queryFn: () => fetchPerms() });
  const isStaff = perms.data?.isStaff ?? false;
  const can = (p: string) =>
    (perms.data?.permissions ?? []).includes("*") || (perms.data?.permissions ?? []).includes(p);

  const doctors = useQuery({
    queryKey: ["doctors", "all"],
    queryFn: () => fetchDoctors({ data: { term: "", includeInactive: true } }),
    enabled: isStaff,
  });

  const list = useQuery({
    queryKey: ["staff-appointments", term, date, doctorId, status],
    queryFn: () =>
      searchAppointments({
        data: { term, date: date || null, doctorId: doctorId || null, status: status || null },
      }),
    enabled: isStaff,
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: (typeof STATUSES)[number] }) =>
      updateStatus({ data: vars }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["staff-appointments"] });
    },
    onError: (e: Error) =>
      setError(e.message.includes("FORBIDDEN") ? t.p3.noPermission : t.p2.genericError),
  });

  const inputClass =
    "w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary";

  if (perms.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title={t.p3.adminAppointments} backTo="/dashboard" />
        <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title={t.p3.adminAppointments} backTo="/dashboard" />
        <p className="px-4 py-10 text-center text-sm font-medium text-destructive">{t.p2.staffOnly}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p3.adminAppointments} backTo="/dashboard" />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <input
          className={inputClass}
          placeholder={t.p3.searchAppointments}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            dir="ltr"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t.p3.allStatuses}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "created"
                  ? t.p3.statusCreated
                  : s === "confirmed"
                    ? t.p3.statusConfirmed
                    : s === "completed"
                      ? t.p3.statusCompleted
                      : t.p3.statusCancelled}
              </option>
            ))}
          </select>
        </div>
        <select className={inputClass} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">{t.p3.manageDoctors}</option>
          {(doctors.data?.doctors ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.specialty_name}
            </option>
          ))}
        </select>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {list.isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
        )}
        {!list.isLoading && (list.data?.appointments ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.p3.noAppointments}</p>
        )}
        {((list.data?.appointments ?? []) as AppointmentRow[]).map((a) => (
          <AppointmentCard key={a.id} appointment={a} detailed={openId === a.id}>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOpenId(openId === a.id ? null : a.id)}
                className="min-h-11 flex-1 rounded-xl border-2 border-primary px-4 text-sm font-semibold text-primary"
              >
                {t.p3.details}
              </button>
              {can("manage_appointments") &&
                STATUSES.filter((s) => s !== a.status).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => statusMutation.mutate({ id: a.id, status: s })}
                    className="min-h-11 rounded-xl border-2 border-border px-3 text-xs font-semibold text-foreground"
                  >
                    {s === "created"
                      ? t.p3.statusCreated
                      : s === "confirmed"
                        ? t.p3.statusConfirmed
                        : s === "completed"
                          ? t.p3.statusCompleted
                          : t.p3.statusCancelled}
                  </button>
                ))}
            </div>
          </AppointmentCard>
        ))}
      </main>
    </div>
  );
}

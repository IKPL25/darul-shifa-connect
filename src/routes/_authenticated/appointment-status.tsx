import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { AppointmentCard, type AppointmentRow } from "@/components/AppointmentCard";
import { useLanguage } from "@/lib/i18n";
import { findMyAppointments } from "@/lib/appointments.functions";

export const Route = createFileRoute("/_authenticated/appointment-status")({
  head: () => ({
    meta: [
      { title: "Appointment Status | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Check the status of your Darul Shifa General Hospital appointment using your appointment number or mobile number.",
      },
      { property: "og:title", content: "Appointment Status | Darul Shifa Hospital" },
      { property: "og:description", content: "Look up your own appointment status securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppointmentStatusPage,
});

function AppointmentStatusPage() {
  const { t } = useLanguage();
  const search = useServerFn(findMyAppointments);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<AppointmentRow[] | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => search({ data: { term: value } }),
    onSuccess: (res: { appointments: AppointmentRow[] }) => setResults(res.appointments),
    onError: () => setResults([]),
  });

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p3.appointmentStatus} backTo="/dashboard" />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <p className="text-sm text-muted-foreground">{t.p3.statusSearchNote}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (term.trim().length >= 3) mutation.mutate(term.trim());
          }}
          className="flex gap-3"
        >
          <input
            dir="ltr"
            className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary"
            placeholder="DSH-20260817-001 / 0300-1234567"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button
            type="submit"
            className="min-h-12 shrink-0 rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
          >
            {t.p2.search}
          </button>
        </form>

        {results && results.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{t.p3.noAppointments}</p>
        )}
        {(results ?? []).map((a) => (
          <AppointmentCard key={a.id} appointment={a} detailed />
        ))}
      </main>
    </div>
  );
}

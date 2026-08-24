import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { AppointmentCard } from "@/components/AppointmentCard";
import { useLanguage } from "@/lib/i18n";
import { listMyAppointments } from "@/lib/appointments.functions";
import { toISODate } from "@/lib/doctor-schema";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({
    meta: [
      { title: "My Appointments | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "View upcoming and previous Darul Shifa General Hospital appointments booked from your Google account.",
      },
      { property: "og:title", content: "My Appointments | Darul Shifa Hospital" },
      { property: "og:description", content: "Upcoming and previous hospital appointments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyAppointmentsPage,
});

function MyAppointmentsPage() {
  const { t } = useLanguage();
  const fetchAppointments = useServerFn(listMyAppointments);
  const { data, isLoading } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => fetchAppointments(),
  });

  const today = toISODate(new Date());
  const all = data?.appointments ?? [];
  const upcoming = all.filter((a) => a.appointment_date >= today);
  const previous = all.filter((a) => a.appointment_date < today);

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p3.myAppointments} backTo="/dashboard" />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>}
        {!isLoading && all.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.p3.noAppointments}</p>
        )}
        {upcoming.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">{t.p3.upcoming}</h2>
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </section>
        )}
        {previous.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">{t.p3.previous}</h2>
            {previous.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

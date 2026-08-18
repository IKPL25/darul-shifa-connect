import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarPlus,
  CalendarDays,
  Activity,
  ReceiptText,
  UserCircle,
  Bell,
  Search,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/i18n";
import { getMyPatient } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Patient Dashboard | Darul Shifa Hospital" },
      {
        name: "description",
        content: "Your Darul Shifa General Hospital patient dashboard: profile, MR number and records.",
      },
      { property: "og:title", content: "Patient Dashboard | Darul Shifa Hospital" },
      { property: "og:description", content: "Darul Shifa patient dashboard and profile." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const fetchPatient = useServerFn(getMyPatient);
  const { data, isLoading } = useQuery({ queryKey: ["my-patient"], queryFn: () => fetchPatient() });
  const patient = data?.patient ?? null;

  useEffect(() => {
    if (!isLoading && data && !patient) router.navigate({ to: "/register", replace: true });
  }, [isLoading, data, patient, router]);

  const tiles = [
    { key: "book", label: t.menu.bookAppointment, icon: CalendarPlus, to: null },
    { key: "mine", label: t.menu.myAppointments, icon: CalendarDays, to: null },
    { key: "status", label: t.menu.appointmentStatus, icon: Activity, to: null },
    { key: "slips", label: t.menu.mySlips, icon: ReceiptText, to: null },
    { key: "profile", label: t.p2.profile, icon: UserCircle, to: "/profile" },
    { key: "notif", label: t.menu.notifications, icon: Bell, to: null },
    { key: "find", label: t.p2.findRecord, icon: Search, to: "/find-record" },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p2.dashboard} showSignOut />
      <main className="mx-auto max-w-2xl px-4 py-5">
        {isLoading || !patient ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{t.p2.welcome}</p>
              <h1 className="text-xl font-bold text-primary">{patient.full_name}</h1>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t.p2.mrNumber}</dt>
                  <dd className="font-semibold text-foreground" dir="ltr">
                    {patient.mr_number ?? (
                      <span className="font-medium text-destructive">{t.p2.mrPending}</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t.p2.mobile}</dt>
                  <dd className="font-semibold text-foreground" dir="ltr">{patient.mobile}</dd>
                </div>
              </dl>
              {!patient.mr_number && (
                <p className="mt-3 text-xs text-muted-foreground">{t.p2.mrNote}</p>
              )}
            </section>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {tiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <button
                    key={tile.key}
                    type="button"
                    onClick={() => tile.to && router.navigate({ to: tile.to })}
                    className={`flex min-h-28 flex-col items-start justify-between rounded-2xl border p-4 text-start ${
                      tile.to ? "border-primary/40 bg-card active:bg-secondary" : "border-border bg-card opacity-70"
                    }`}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </span>
                    <span className="text-sm font-semibold leading-snug text-foreground">{tile.label}</span>
                    {!tile.to && <span className="text-xs font-medium text-destructive">{t.comingSoon}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

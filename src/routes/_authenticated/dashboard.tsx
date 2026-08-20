import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarPlus,
  CalendarDays,
  Activity,
  ReceiptText,
  Users,
  Bell,
  Search,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/i18n";
import { getMyAccount, listMyPatients } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Patient Dashboard | Darul Shifa Hospital" },
      {
        name: "description",
        content: "Your Darul Shifa General Hospital dashboard: family patient records and MR numbers.",
      },
      { property: "og:title", content: "Patient Dashboard | Darul Shifa Hospital" },
      { property: "og:description", content: "Darul Shifa dashboard for you and your family." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const fetchAccount = useServerFn(getMyAccount);
  const fetchPatients = useServerFn(listMyPatients);

  const { data: accountData } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const { data, isLoading } = useQuery({ queryKey: ["my-patients"], queryFn: () => fetchPatients() });
  const patients = data?.patients ?? [];

  useEffect(() => {
    if (!isLoading && data && patients.length === 0) router.navigate({ to: "/register", replace: true });
  }, [isLoading, data, patients.length, router]);

  const tiles = [
    { key: "book", label: t.menu.bookAppointment, icon: CalendarPlus, to: null },
    { key: "mine", label: t.menu.myAppointments, icon: CalendarDays, to: null },
    { key: "status", label: t.menu.appointmentStatus, icon: Activity, to: null },
    { key: "slips", label: t.menu.mySlips, icon: ReceiptText, to: null },
    { key: "profile", label: t.p2.myPatients, icon: Users, to: "/profile" },
    { key: "notif", label: t.menu.notifications, icon: Bell, to: null },
    { key: "find", label: t.p2.findRecord, icon: Search, to: "/find-record" },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p2.dashboard} showSignOut />
      <main className="mx-auto max-w-2xl px-4 py-5">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{t.p2.welcome}</p>
              <h1 className="text-xl font-bold text-primary" dir="ltr">
                {accountData?.account.google_email ?? ""}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">{t.p2.myPatientsNote}</p>
            </section>

            <section className="mt-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">{t.p2.myPatients}</h2>
              {patients.map((patient) => (
                <div key={patient.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-bold text-foreground">{patient.full_name}</p>
                    {patient.is_self && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {t.p2.selfBadge}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground" dir="ltr">
                    {t.p2.mrNumber}: {patient.mr_number ?? t.p2.mrPending}
                  </p>
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {t.p2.mobile}: {patient.mobile}
                  </p>
                </div>
              ))}
              <button
                type="button"
                onClick={() => router.navigate({ to: "/profile" })}
                className="min-h-12 w-full rounded-xl border-2 border-primary px-5 font-semibold text-primary"
              >
                {t.p2.addPatient}
              </button>
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

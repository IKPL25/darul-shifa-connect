import { createFileRoute, useRouter } from "@tanstack/react-router";
import { User, ShieldCheck, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { HospitalLogo } from "@/components/HospitalLogo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/role")({
  head: () => ({
    meta: [
      { title: "Select Role | Darul Shifa Appointment Portal" },
      {
        name: "description",
        content:
          "Continue as Patient, Admin or Master Admin in the Darul Shifa General Hospital Appointment Portal.",
      },
      { property: "og:title", content: "Select Role | Darul Shifa Appointment Portal" },
      {
        property: "og:description",
        content: "Choose Patient, Admin or Master Admin to continue.",
      },
    ],
  }),
  component: RolePage,
});

function RolePage() {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const roles = [
    { to: "/patient", label: t.patient, icon: User },
    { to: "/admin", label: t.admin, icon: ShieldCheck },
    { to: "/master-admin", label: t.masterAdmin, icon: Crown },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary px-4 py-3 text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold">{t.portal}</p>
          <LanguageToggle variant="onPrimary" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        <HospitalLogo className="mx-auto" />
        <h1 className="mt-8 text-center text-xl font-bold text-primary">{t.selectRole}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t.selectRoleNote}</p>

        <div className="mt-6 space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.to}
                type="button"
                onClick={() => router.navigate({ to: r.to })}
                className="flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 border-border bg-card px-5 text-start transition-colors active:border-destructive active:bg-destructive/5"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="size-6" />
                </span>
                <span className="flex-1 text-lg font-semibold text-foreground">{r.label}</span>
                <Chevron className="size-6 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{t.contact}</p>
          <p className="mt-1">{t.address}</p>
          <p className="mt-1" dir="ltr">
            021-34508390-91 · WhatsApp +92-34-2225746
          </p>
          <p dir="ltr">darulshifa@gmail.com · facebook.com/diskmalir</p>
        </section>
      </main>
    </div>
  );
}
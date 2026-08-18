import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { HospitalLogo } from "@/components/HospitalLogo";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Darul Shifa General Hospital Appointment Portal" },
      {
        name: "description",
        content:
          "Official appointment portal of Darul Shifa General Hospital, Malir, Karachi. Available in English and Urdu.",
      },
      { property: "og:title", content: "Darul Shifa General Hospital Appointment Portal" },
      {
        property: "og:description",
        content: "Official appointment portal of Darul Shifa General Hospital, Malir, Karachi.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const router = useRouter();
  const { t, ready, hasChosen } = useLanguage();

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      router.navigate({ to: hasChosen ? "/role" : "/language" });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [ready, hasChosen, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md animate-in fade-in duration-700">
        <HospitalLogo />
        <div className="mt-8 h-1 w-24 mx-auto rounded-full bg-destructive" />
        <h1 className="mt-6 text-center text-2xl font-bold text-primary">{t.hospital}</h1>
        <p className="mt-2 text-center text-base font-medium text-destructive">{t.portal}</p>
      </div>
      <p className="mt-12 text-center text-xs text-muted-foreground">{t.address}</p>
    </main>
  );
}

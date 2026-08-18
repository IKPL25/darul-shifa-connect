import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { HospitalLogo } from "@/components/HospitalLogo";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/patient")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Patient Login | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Sign in with your Google account to access your Darul Shifa General Hospital patient profile and MR record.",
      },
      { property: "og:title", content: "Patient Login | Darul Shifa Hospital" },
      {
        property: "og:description",
        content: "Secure Google sign-in for Darul Shifa General Hospital patients.",
      },
    ],
  }),
  component: PatientLoginPage,
});

function PatientLoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/dashboard", replace: true });
    });
  }, [router]);

  async function signIn() {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/patient",
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setError(t.p2.genericError);
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    router.navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={t.p2.patientLogin} backTo="/role" />
      <main className="mx-auto max-w-md px-5 py-8">
        <HospitalLogo className="mx-auto" />
        <h1 className="mt-8 text-center text-xl font-bold text-primary">{t.patientTitle}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t.p2.signInNote}</p>

        <button
          type="button"
          onClick={signIn}
          disabled={busy}
          className="mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 text-base font-semibold text-primary-foreground disabled:opacity-60"
        >
          <LogIn className="size-5" />
          {busy ? t.p2.signingIn : t.p2.signIn}
        </button>
        {error && <p className="mt-3 text-center text-sm font-medium text-destructive">{error}</p>}
      </main>
    </div>
  );
}

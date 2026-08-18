import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { HospitalLogo } from "@/components/HospitalLogo";
import { useLanguage, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/language")({
  head: () => ({
    meta: [
      { title: "Language | Darul Shifa Appointment Portal" },
      {
        name: "description",
        content:
          "Choose English or Urdu for the Darul Shifa General Hospital Appointment Portal.",
      },
      { property: "og:title", content: "Language | Darul Shifa Appointment Portal" },
      {
        property: "og:description",
        content: "Select your preferred language: English or Urdu.",
      },
    ],
  }),
  component: LanguagePage,
});

function LanguagePage() {
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();

  const options: { code: Lang; label: string; sub: string }[] = [
    { code: "en", label: "English", sub: "Left to right" },
    { code: "ur", label: "اردو", sub: "دائیں سے بائیں" },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-5 py-10">
      <HospitalLogo className="mx-auto" />
      <h1 className="mt-8 text-center text-xl font-bold text-primary">{t.chooseLanguage}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">{t.languageNote}</p>

      <div className="mt-6 w-full max-w-md space-y-3">
        {options.map((o) => {
          const selected = lang === o.code;
          return (
            <button
              key={o.code}
              type="button"
              onClick={() => setLang(o.code)}
              className={`flex min-h-16 w-full items-center justify-between rounded-2xl border-2 px-5 text-start transition-colors ${
                selected ? "border-destructive bg-destructive/5" : "border-border bg-card"
              }`}
            >
              <span>
                <span className="block text-lg font-semibold text-foreground">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.sub}</span>
              </span>
              {selected && <Check className="size-6 text-destructive" />}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => router.navigate({ to: "/role" })}
        className="mt-8 min-h-14 w-full max-w-md rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-colors active:bg-primary/90"
      >
        {t.continue}
      </button>
    </main>
  );
}
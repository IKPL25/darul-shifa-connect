import { useLanguage } from "@/lib/i18n";

export function LanguageToggle({ variant = "default" }: { variant?: "default" | "onPrimary" }) {
  const { lang, setLang } = useLanguage();
  const onPrimary = variant === "onPrimary";

  return (
    <div
      className={`flex shrink-0 items-center rounded-full p-1 ${
        onPrimary ? "bg-primary-foreground/15" : "bg-secondary"
      }`}
    >
      {(["en", "ur"] as const).map((code) => {
        const selected = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`min-w-11 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              selected
                ? "bg-destructive text-destructive-foreground"
                : onPrimary
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
            }`}
          >
            {code === "en" ? "EN" : "اردو"}
          </button>
        );
      })}
    </div>
  );
}
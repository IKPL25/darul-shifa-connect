import { useState, type ComponentType } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HospitalLogo } from "./HospitalLogo";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "@/lib/i18n";

export type MenuItem = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
};

export function PortalScreen({ title, items }: { title: string; items: MenuItem[] }) {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="bg-primary px-4 py-3 text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => router.navigate({ to: "/role" })}
            aria-label={t.back}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors active:bg-primary-foreground/20"
          >
            <BackIcon className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{title}</p>
            <p className="truncate text-xs opacity-80">{t.hospital}</p>
          </div>
          <LanguageToggle variant="onPrimary" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        <div className="mb-5 rounded-2xl border border-border bg-card p-4">
          <HospitalLogo className="mx-auto max-w-xs" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  item.to ? router.navigate({ to: item.to }) : setActive(isActive ? null : item.key)
                }
                className={`flex min-h-28 flex-col items-start justify-between rounded-2xl border p-4 text-start transition-colors ${
                  isActive
                    ? "border-destructive bg-destructive/5"
                    : "border-border bg-card active:bg-secondary"
                }`}
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ${
                    isActive ? "bg-destructive text-destructive-foreground" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="size-6" />
                </span>
                <span className="text-sm font-semibold leading-snug text-foreground">{item.label}</span>
                {isActive && (
                  <span className="text-xs font-medium text-destructive">{t.comingSoon}</span>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
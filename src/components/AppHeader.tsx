import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, LogOut } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader({
  title,
  backTo,
  showSignOut = false,
}: {
  title: string;
  backTo?: string;
  showSignOut?: boolean;
}) {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/patient", replace: true });
  }

  return (
    <header className="bg-primary px-4 py-3 text-primary-foreground shadow-md">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        {backTo && (
          <button
            type="button"
            onClick={() => router.navigate({ to: backTo })}
            aria-label={t.back}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors active:bg-primary-foreground/20"
          >
            <BackIcon className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{title}</p>
          <p className="truncate text-xs opacity-80">{t.hospital}</p>
        </div>
        <LanguageToggle variant="onPrimary" />
        {showSignOut && (
          <button
            type="button"
            onClick={handleSignOut}
            aria-label={t.p2.signOut}
            title={t.p2.signOut}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors active:bg-primary-foreground/20"
          >
            <LogOut className="size-5" />
          </button>
        )}
      </div>
    </header>
  );
}

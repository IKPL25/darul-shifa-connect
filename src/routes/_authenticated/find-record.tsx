import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/i18n";
import { findMyRecord } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/find-record")({
  head: () => ({
    meta: [
      { title: "Find My Record | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Securely confirm your own Darul Shifa General Hospital record using your mobile or MR number.",
      },
      { property: "og:title", content: "Find My Record | Darul Shifa Hospital" },
      { property: "og:description", content: "Secure record lookup for signed-in Darul Shifa patients." },
    ],
  }),
  component: FindRecordPage,
});

function FindRecordPage() {
  const { t } = useLanguage();
  const [term, setTerm] = useState("");
  const search = useServerFn(findMyRecord);
  const mutation = useMutation({ mutationFn: (value: string) => search({ data: { term: value } }) });
  const patient = mutation.data?.patient ?? null;

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p2.findRecord} backTo="/dashboard" showSignOut />
      <main className="mx-auto max-w-md px-5 py-6">
        <p className="text-sm text-muted-foreground">{t.p2.findRecordNote}</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (term.trim().length >= 3) mutation.mutate(term.trim());
          }}
        >
          <input
            dir="ltr"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="0300-1234567 / MR-000001"
            className="min-h-12 flex-1 rounded-xl border-2 border-border bg-card px-4 text-base text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
          >
            {t.p2.search}
          </button>
        </form>

        {mutation.isSuccess && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            {patient ? (
              <>
                <p className="text-sm font-semibold text-primary">{t.p2.recordFound}</p>
                <p className="mt-3 text-base font-bold text-foreground">{patient.full_name}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {t.p2.mrNumber}: {patient.mr_number ?? t.p2.mrPending}
                </p>
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {t.p2.mobile}: {patient.mobile}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-destructive">{t.p2.recordNotFound}</p>
            )}
          </div>
        )}
        {mutation.isError && (
          <p className="mt-3 text-sm font-medium text-destructive">{t.p2.genericError}</p>
        )}
      </main>
    </div>
  );
}

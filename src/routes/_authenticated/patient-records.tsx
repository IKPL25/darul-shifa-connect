import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/lib/i18n";
import { mrRegex } from "@/lib/patient-schema";
import {
  getMyRole,
  staffSearchPatients,
  assignMrNumber,
  nextMrNumber,
} from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/patient-records")({
  head: () => ({
    meta: [
      { title: "Patient Records | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Admin and Master Admin area to search Darul Shifa patient records and assign MR numbers.",
      },
      { property: "og:title", content: "Patient Records | Darul Shifa Hospital" },
      { property: "og:description", content: "Staff patient search and MR number assignment." },
    ],
  }),
  component: PatientRecordsPage,
});

function PatientRecordsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fetchRole = useServerFn(getMyRole);
  const search = useServerFn(staffSearchPatients);
  const assign = useServerFn(assignMrNumber);
  const suggest = useServerFn(nextMrNumber);

  const [term, setTerm] = useState("");
  const [mrDrafts, setMrDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = useQuery({ queryKey: ["my-role"], queryFn: () => fetchRole() });
  const isStaff = role.data?.isStaff ?? false;

  const list = useQuery({
    queryKey: ["staff-patients", term],
    queryFn: () => search({ data: { term } }),
    enabled: isStaff,
  });

  const assignMutation = useMutation({
    mutationFn: (vars: { patientId: string; mrNumber: string }) => assign({ data: vars }),
    onSuccess: async () => {
      setError(null);
      setNotice(t.p2.assigned);
      await queryClient.invalidateQueries({ queryKey: ["staff-patients"] });
    },
    onError: (e: Error) => {
      setNotice(null);
      setError(e.message.includes("MR_DUPLICATE") ? t.p2.errors.duplicateMr : t.p2.genericError);
    },
  });

  async function fillSuggestion(patientId: string) {
    try {
      const { mrNumber } = await suggest();
      setMrDrafts((d) => ({ ...d, [patientId]: mrNumber }));
    } catch {
      setError(t.p2.genericError);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p2.patientRecords} backTo="/role" showSignOut />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {role.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
        ) : !isStaff ? (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm font-medium text-destructive">
            {t.p2.staffOnly}
          </p>
        ) : (
          <>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t.p2.searchPatients}
              className="min-h-12 w-full rounded-xl border-2 border-border bg-card px-4 text-base text-foreground outline-none focus:border-primary"
            />
            {notice && <p className="mt-3 text-sm font-semibold text-primary">{notice}</p>}
            {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}

            <div className="mt-5 space-y-3">
              {list.isLoading && (
                <p className="text-center text-sm text-muted-foreground">{t.p2.loading}</p>
              )}
              {list.data?.patients.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">{t.p2.noResults}</p>
              )}
              {list.data?.patients.map((p) => (
                <article key={p.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-base font-bold text-foreground">{p.full_name}</p>
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {p.mobile} · {p.cnic}
                  </p>
                  <p className="mt-1 text-sm" dir="ltr">
                    <span className="text-muted-foreground">{t.p2.mrNumber}: </span>
                    <span className="font-semibold text-primary">
                      {p.mr_number ?? t.p2.mrPending}
                    </span>
                  </p>
                  {!p.mr_number && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        dir="ltr"
                        placeholder="MR-000001"
                        value={mrDrafts[p.id] ?? ""}
                        onFocus={() => {
                          if (!mrDrafts[p.id]) void fillSuggestion(p.id);
                        }}
                        onChange={(e) => setMrDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                        className="min-h-11 flex-1 rounded-xl border-2 border-border bg-background px-3 text-sm outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        disabled={assignMutation.isPending}
                        onClick={() => {
                          const value = (mrDrafts[p.id] ?? "").trim().toUpperCase();
                          if (!mrRegex.test(value)) {
                            setNotice(null);
                            setError(t.p2.errors.mr);
                            return;
                          }
                          assignMutation.mutate({ patientId: p.id, mrNumber: value });
                        }}
                        className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        {t.p2.assign}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

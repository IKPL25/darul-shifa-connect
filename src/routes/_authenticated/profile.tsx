import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { PatientForm, emptyPatientForm, type PatientFormValues } from "@/components/PatientForm";
import { useLanguage } from "@/lib/i18n";
import { deleteMyPatient, listMyPatients, savePatient } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Patients | Darul Shifa Hospital" },
      {
        name: "description",
        content: "Manage the patient records — yourself and family members — linked to your Darul Shifa account.",
      },
      { property: "og:title", content: "My Patients | Darul Shifa Hospital" },
      { property: "og:description", content: "Darul Shifa family patient records and MR numbers." },
    ],
  }),
  component: PatientsPage,
});

type EditState = { id?: string; values: PatientFormValues; isSelf: boolean } | null;

function PatientsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fetchPatients = useServerFn(listMyPatients);
  const save = useServerFn(savePatient);
  const remove = useServerFn(deleteMyPatient);
  const [editing, setEditing] = useState<EditState>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["my-patients"], queryFn: () => fetchPatients() });
  const patients = data?.patients ?? [];
  const hasSelf = patients.some((p) => p.is_self && p.id !== editing?.id);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["my-patients"] });
    setEditing(null);
    setSaved(true);
  };

  const mutation = useMutation({
    mutationFn: ({ values, isSelf }: { values: PatientFormValues; isSelf: boolean }) =>
      save({
        data: {
          ...(editing?.id ? { id: editing.id } : {}),
          ...values,
          age: Number(values.age),
          is_self: isSelf && !hasSelf,
          relation: isSelf ? "self" : "other",
        },
      }),
    onSuccess: refresh,
  });

  const removal = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-patients"] });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p2.myPatients} backTo="/dashboard" showSignOut />
      <main className="mx-auto max-w-md px-5 py-6">
        {editing ? (
          <PatientForm
            initial={editing.values}
            initialIsSelf={editing.isSelf}
            showWhoSelector
            submitLabel={t.p2.saveChanges}
            pending={mutation.isPending}
            onSubmit={(values, isSelf) => mutation.mutate({ values, isSelf })}
            onCancel={() => setEditing(null)}
          />
        ) : isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
        ) : (
          <>
            {saved && (
              <p className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm font-semibold text-primary">
                {t.p2.patientSaved}
              </p>
            )}
            <p className="mb-4 text-sm text-muted-foreground">{t.p2.myPatientsNote}</p>

            {patients.length === 0 && (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {t.p2.noPatients}
              </p>
            )}

            <div className="space-y-3">
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
                  <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <dt>{t.p2.mrNumber}</dt>
                      <dd dir="ltr" className="font-semibold text-foreground">
                        {patient.mr_number ?? t.p2.mrPending}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>{t.p2.relation}</dt>
                      <dd className="text-foreground">{patient.guardian_name}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>{t.p2.age}</dt>
                      <dd className="text-foreground">{patient.age}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>{t.p2.gender}</dt>
                      <dd className="text-foreground">
                        {patient.gender === "male"
                          ? t.p2.male
                          : patient.gender === "female"
                            ? t.p2.female
                            : t.p2.other}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>{t.p2.mobile}</dt>
                      <dd dir="ltr" className="text-foreground">{patient.mobile}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSaved(false);
                        setEditing({
                          id: patient.id,
                          isSelf: patient.is_self,
                          values: {
                            full_name: patient.full_name,
                            guardian_name: patient.guardian_name,
                            age: String(patient.age),
                            gender: patient.gender,
                            mobile: patient.mobile,
                          },
                        });
                      }}
                      className="min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                    >
                      {t.p2.editPatient}
                    </button>
                    {!patient.mr_number && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(t.p2.confirmRemove)) removal.mutate(patient.id);
                        }}
                        className="min-h-11 rounded-xl border-2 border-destructive px-4 text-sm font-semibold text-destructive"
                      >
                        {t.p2.remove}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setSaved(false);
                setEditing({ values: emptyPatientForm, isSelf: !hasSelf });
              }}
              className="mt-5 min-h-12 w-full rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
            >
              {t.p2.addPatient}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">{t.p2.mrNote}</p>
          </>
        )}
        {mutation.isError && (
          <p className="mt-3 text-sm font-medium text-destructive">{t.p2.genericError}</p>
        )}
      </main>
    </div>
  );
}

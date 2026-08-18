import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { PatientForm, type PatientFormValues } from "@/components/PatientForm";
import { useLanguage } from "@/lib/i18n";
import { getMyPatient, saveMyProfile } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile | Darul Shifa Hospital" },
      {
        name: "description",
        content: "View and update your Darul Shifa General Hospital patient profile details.",
      },
      { property: "og:title", content: "My Profile | Darul Shifa Hospital" },
      { property: "og:description", content: "Darul Shifa patient profile and MR number." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fetchPatient = useServerFn(getMyPatient);
  const save = useServerFn(saveMyProfile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["my-patient"], queryFn: () => fetchPatient() });
  const patient = data?.patient ?? null;

  const mutation = useMutation({
    mutationFn: (values: PatientFormValues) => save({ data: { ...values, age: Number(values.age) } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-patient"] });
      setEditing(false);
      setSaved(true);
    },
  });

  const rows = patient
    ? [
        { label: t.p2.mrNumber, value: patient.mr_number ?? t.p2.mrPending, ltr: true },
        { label: t.p2.email, value: patient.google_email, ltr: true },
        { label: t.p2.fullName, value: patient.full_name },
        { label: t.p2.guardianName, value: patient.guardian_name },
        { label: t.p2.age, value: String(patient.age) },
        {
          label: t.p2.gender,
          value:
            patient.gender === "male" ? t.p2.male : patient.gender === "female" ? t.p2.female : t.p2.other,
        },
        { label: t.p2.mobile, value: patient.mobile, ltr: true },
        { label: t.p2.cnic, value: patient.cnic, ltr: true },
        { label: t.p2.address, value: patient.address },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p2.profile} backTo="/dashboard" showSignOut />
      <main className="mx-auto max-w-md px-5 py-6">
        {isLoading || !patient ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
        ) : editing ? (
          <PatientForm
            initial={{
              full_name: patient.full_name,
              guardian_name: patient.guardian_name,
              age: String(patient.age),
              gender: patient.gender,
              mobile: patient.mobile,
              cnic: patient.cnic,
              address: patient.address,
            }}
            submitLabel={t.p2.saveChanges}
            pending={mutation.isPending}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            {saved && (
              <p className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm font-semibold text-primary">
                {t.p2.profileUpdated}
              </p>
            )}
            <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {rows.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd
                    className="text-end text-sm font-semibold text-foreground"
                    {...(row.ltr ? { dir: "ltr" as const } : {})}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{t.p2.mrNote}</p>
            <button
              type="button"
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
              className="mt-5 min-h-12 w-full rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
            >
              {t.p2.editProfile}
            </button>
          </>
        )}
        {mutation.isError && (
          <p className="mt-3 text-sm font-medium text-destructive">{t.p2.genericError}</p>
        )}
      </main>
    </div>
  );
}

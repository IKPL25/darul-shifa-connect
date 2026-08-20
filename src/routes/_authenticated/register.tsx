import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { PatientForm, emptyPatientForm, type PatientFormValues } from "@/components/PatientForm";
import { useLanguage } from "@/lib/i18n";
import { listMyPatients, savePatient } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({
    meta: [
      { title: "Add Patient | Darul Shifa Hospital" },
      {
        name: "description",
        content: "Add yourself or a family member as a patient of Darul Shifa General Hospital.",
      },
      { property: "og:title", content: "Add Patient | Darul Shifa Hospital" },
      { property: "og:description", content: "Add a Darul Shifa patient record to your account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fetchPatients = useServerFn(listMyPatients);
  const save = useServerFn(savePatient);

  const { data } = useQuery({ queryKey: ["my-patients"], queryFn: () => fetchPatients() });
  const hasSelf = (data?.patients ?? []).some((p) => p.is_self);

  useEffect(() => {
    if ((data?.patients ?? []).length > 0) router.navigate({ to: "/dashboard", replace: true });
  }, [data, router]);

  const mutation = useMutation({
    mutationFn: ({ values, isSelf }: { values: PatientFormValues; isSelf: boolean }) =>
      save({
        data: {
          ...values,
          age: Number(values.age),
          is_self: isSelf && !hasSelf,
          relation: isSelf ? "self" : "other",
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-patients"] });
      router.navigate({ to: "/dashboard", replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p2.addPatient} showSignOut />
      <main className="mx-auto max-w-md px-5 py-6">
        <p className="mb-5 text-sm text-muted-foreground">{t.p2.myPatientsNote}</p>
        <PatientForm
          initial={emptyPatientForm}
          showWhoSelector
          submitLabel={t.p2.saveChanges}
          pending={mutation.isPending}
          onSubmit={(values, isSelf) => mutation.mutate({ values, isSelf })}
        />
        {mutation.isError && (
          <p className="mt-3 text-sm font-medium text-destructive">{t.p2.genericError}</p>
        )}
      </main>
    </div>
  );
}

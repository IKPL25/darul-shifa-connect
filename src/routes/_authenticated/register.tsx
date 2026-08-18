import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { PatientForm, emptyPatientForm, type PatientFormValues } from "@/components/PatientForm";
import { useLanguage } from "@/lib/i18n";
import { getMyPatient, saveMyProfile } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({
    meta: [
      { title: "Patient Registration | Darul Shifa Hospital" },
      {
        name: "description",
        content: "Complete your Darul Shifa General Hospital patient profile after Google sign-in.",
      },
      { property: "og:title", content: "Patient Registration | Darul Shifa Hospital" },
      { property: "og:description", content: "Create your Darul Shifa patient profile." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fetchPatient = useServerFn(getMyPatient);
  const save = useServerFn(saveMyProfile);

  const { data } = useQuery({ queryKey: ["my-patient"], queryFn: () => fetchPatient() });

  useEffect(() => {
    if (data?.patient) router.navigate({ to: "/dashboard", replace: true });
  }, [data, router]);

  const mutation = useMutation({
    mutationFn: (values: PatientFormValues) => save({ data: { ...values, age: Number(values.age) } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-patient"] });
      router.navigate({ to: "/dashboard", replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p2.register} showSignOut />
      <main className="mx-auto max-w-md px-5 py-6">
        <p className="mb-5 text-sm text-muted-foreground">{t.p2.registerNote}</p>
        <PatientForm
          initial={emptyPatientForm}
          submitLabel={t.p2.saveChanges}
          pending={mutation.isPending}
          onSubmit={(values) => mutation.mutate(values)}
        />
        {mutation.isError && (
          <p className="mt-3 text-sm font-medium text-destructive">{t.p2.genericError}</p>
        )}
      </main>
    </div>
  );
}

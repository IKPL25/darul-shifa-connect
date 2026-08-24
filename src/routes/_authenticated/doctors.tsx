import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { DoctorCard, type DoctorRow } from "@/components/DoctorCard";
import { useLanguage } from "@/lib/i18n";
import {
  getMyPermissions,
  listDoctors,
  listSpecialties,
  saveDoctor,
  saveSpecialty,
  setDoctorActive,
} from "@/lib/doctors.functions";

export const Route = createFileRoute("/_authenticated/doctors")({
  head: () => ({
    meta: [
      { title: "Doctor Management | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Add, edit and activate Darul Shifa General Hospital doctors, specialties, working days, OPD timing and appointment fees.",
      },
      { property: "og:title", content: "Doctor Management | Darul Shifa Hospital" },
      { property: "og:description", content: "Manage hospital doctors, specialties and schedules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DoctorsPage,
});

type DoctorDraft = {
  id?: string;
  name: string;
  specialty_id: string;
  qualification: string;
  days: number[];
  opd_timing: string;
  fee: string;
  is_active: boolean;
};

const emptyDraft: DoctorDraft = {
  name: "",
  specialty_id: "",
  qualification: "",
  days: [],
  opd_timing: "",
  fee: "",
  is_active: true,
};

function DoctorsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const fetchPerms = useServerFn(getMyPermissions);
  const fetchDoctors = useServerFn(listDoctors);
  const fetchSpecialties = useServerFn(listSpecialties);
  const saveDoc = useServerFn(saveDoctor);
  const toggleDoc = useServerFn(setDoctorActive);
  const saveSpec = useServerFn(saveSpecialty);

  const [draft, setDraft] = useState<DoctorDraft | null>(null);
  const [specName, setSpecName] = useState("");
  const [specNameUr, setSpecNameUr] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const perms = useQuery({ queryKey: ["my-perms"], queryFn: () => fetchPerms() });
  const isStaff = perms.data?.isStaff ?? false;
  const can = (p: string) =>
    (perms.data?.permissions ?? []).includes("*") || (perms.data?.permissions ?? []).includes(p);

  const specialties = useQuery({
    queryKey: ["specialties"],
    queryFn: () => fetchSpecialties(),
    enabled: isStaff,
  });
  const doctors = useQuery({
    queryKey: ["doctors", "all"],
    queryFn: () => fetchDoctors({ data: { term: "", includeInactive: true } }),
    enabled: isStaff,
  });

  const doctorMutation = useMutation({
    mutationFn: (input: unknown) => saveDoc({ data: input as never }),
    onSuccess: async () => {
      setError(null);
      setNotice(t.p3.saved);
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (e: Error) => {
      setNotice(null);
      setError(e.message.includes("FORBIDDEN") ? t.p3.noPermission : t.p2.genericError);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => toggleDoc({ data: vars }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (e: Error) =>
      setError(e.message.includes("FORBIDDEN") ? t.p3.noPermission : t.p2.genericError),
  });

  const specialtyMutation = useMutation({
    mutationFn: (input: { name: string; name_ur: string | null; is_active: boolean }) =>
      saveSpec({ data: input as never }),
    onSuccess: async () => {
      setError(null);
      setNotice(t.p3.saved);
      setSpecName("");
      setSpecNameUr("");
      await queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
    onError: (e: Error) => {
      setNotice(null);
      setError(
        e.message.includes("DUPLICATE")
          ? t.p3.duplicateSpecialty
          : e.message.includes("FORBIDDEN")
            ? t.p3.noPermission
            : t.p2.genericError,
      );
    },
  });

  if (perms.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title={t.p3.doctorManagement} backTo="/dashboard" />
        <p className="py-10 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title={t.p3.doctorManagement} backTo="/dashboard" />
        <p className="px-4 py-10 text-center text-sm font-medium text-destructive">{t.p2.staffOnly}</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p3.doctorManagement} backTo="/dashboard" />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {notice && (
          <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">{notice}</p>
        )}
        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {/* Specialties */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-foreground">{t.p3.specialtyManagement}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(specialties.data?.specialties ?? []).map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={!can("manage_specialties")}
                onClick={() =>
                  specialtyMutation.mutate({
                    id: s.id,
                    name: s.name,
                    name_ur: s.name_ur,
                    is_active: !s.is_active,
                  } as never)
                }
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-semibold ${
                  s.is_active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground line-through"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          {can("manage_specialties") && (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <input
                className={inputClass}
                placeholder={t.p3.specialtyName}
                value={specName}
                onChange={(e) => setSpecName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder={t.p3.specialtyNameUr}
                value={specNameUr}
                onChange={(e) => setSpecNameUr(e.target.value)}
              />
              <button
                type="button"
                disabled={specName.trim().length < 2 || specialtyMutation.isPending}
                onClick={() =>
                  specialtyMutation.mutate({
                    name: specName.trim(),
                    name_ur: specNameUr.trim() || null,
                    is_active: true,
                  })
                }
                className="min-h-12 rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
              >
                {t.p3.addSpecialty}
              </button>
            </div>
          )}
        </section>

        {/* Doctor editor */}
        {draft ? (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold text-foreground">
              {draft.id ? t.p3.editDoctor : t.p3.addDoctor}
            </h2>
            <div className="space-y-3">
              <input
                className={inputClass}
                placeholder={t.p3.doctorName}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <select
                className={inputClass}
                value={draft.specialty_id}
                onChange={(e) => setDraft({ ...draft, specialty_id: e.target.value })}
              >
                <option value="">{t.p3.specialty}</option>
                {(specialties.data?.specialties ?? [])
                  .filter((s) => s.is_active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <input
                className={inputClass}
                placeholder={t.p3.qualification}
                value={draft.qualification}
                onChange={(e) => setDraft({ ...draft, qualification: e.target.value })}
              />
              <div>
                <span className="mb-2 block text-sm font-semibold text-foreground">{t.p3.days}</span>
                <div className="flex flex-wrap gap-2">
                  {t.p3.weekdays.map((label, index) => {
                    const selected = draft.days.includes(index);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            days: selected
                              ? draft.days.filter((d) => d !== index)
                              : [...draft.days, index],
                          })
                        }
                        className={`min-h-11 rounded-xl border-2 px-3 text-sm font-semibold ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                className={inputClass}
                dir="ltr"
                placeholder={t.p3.opdTimingHint}
                value={draft.opd_timing}
                onChange={(e) => setDraft({ ...draft, opd_timing: e.target.value })}
              />
              <input
                className={inputClass}
                inputMode="numeric"
                dir="ltr"
                placeholder={t.p3.fee}
                value={draft.fee}
                onChange={(e) => setDraft({ ...draft, fee: e.target.value })}
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={doctorMutation.isPending}
                  onClick={() => {
                    const specialty = (specialties.data?.specialties ?? []).find(
                      (s) => s.id === draft.specialty_id,
                    );
                    if (!specialty || draft.days.length === 0 || draft.name.trim().length < 2) {
                      setError(t.p2.genericError);
                      return;
                    }
                    doctorMutation.mutate({
                      ...(draft.id ? { id: draft.id } : {}),
                      name: draft.name.trim(),
                      specialty_id: specialty.id,
                      specialty_name: specialty.name,
                      qualification: draft.qualification.trim(),
                      days: draft.days,
                      opd_timing: draft.opd_timing.trim(),
                      fee: Number(draft.fee || 0),
                      is_active: draft.is_active,
                    });
                  }}
                  className="min-h-12 flex-1 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {doctorMutation.isPending ? t.p2.saving : t.p3.save}
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="min-h-12 rounded-xl border-2 border-border px-5 font-semibold text-foreground"
                >
                  {t.p2.cancel}
                </button>
              </div>
            </div>
          </section>
        ) : (
          can("add_doctor") && (
            <button
              type="button"
              onClick={() => setDraft(emptyDraft)}
              className="min-h-12 w-full rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
            >
              {t.p3.addDoctor}
            </button>
          )
        )}

        {/* Doctor list */}
        <section className="space-y-3">
          {doctors.isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
          )}
          {(doctors.data?.doctors ?? []).map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor as DoctorRow}>
              <div className="mt-3 flex gap-3">
                {can("edit_doctor") && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: doctor.id,
                        name: doctor.name,
                        specialty_id: doctor.specialty_id ?? "",
                        qualification: doctor.qualification ?? "",
                        days: doctor.days ?? [],
                        opd_timing: doctor.opd_timing ?? "",
                        fee: String(doctor.fee ?? 0),
                        is_active: doctor.is_active,
                      })
                    }
                    className="min-h-11 flex-1 rounded-xl border-2 border-primary px-4 text-sm font-semibold text-primary"
                  >
                    {t.p3.editDoctor}
                  </button>
                )}
                {can("edit_doctor") && (
                  <button
                    type="button"
                    onClick={() =>
                      toggleMutation.mutate({ id: doctor.id, isActive: !doctor.is_active })
                    }
                    className="min-h-11 flex-1 rounded-xl border-2 border-destructive px-4 text-sm font-semibold text-destructive"
                  >
                    {doctor.is_active ? t.p3.deactivate : t.p3.activate}
                  </button>
                )}
              </div>
            </DoctorCard>
          ))}
          {!doctors.isLoading && (doctors.data?.doctors ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.p3.noDoctors}</p>
          )}
        </section>
      </main>
    </div>
  );
}

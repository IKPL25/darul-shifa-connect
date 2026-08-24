import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DoctorCard, type DoctorRow } from "@/components/DoctorCard";
import { PatientForm, emptyPatientForm } from "@/components/PatientForm";
import { useLanguage } from "@/lib/i18n";
import { availableDates } from "@/lib/doctor-schema";
import { listMyPatients, savePatient } from "@/lib/patients.functions";
import { listDoctors, listSpecialties } from "@/lib/doctors.functions";
import { createAppointment } from "@/lib/appointments.functions";

export const Route = createFileRoute("/_authenticated/book")({
  head: () => ({
    meta: [
      { title: "Book Appointment | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Book an OPD appointment at Darul Shifa General Hospital for yourself or a family member with your chosen doctor and date.",
      },
      { property: "og:title", content: "Book Appointment | Darul Shifa Hospital" },
      { property: "og:description", content: "Choose a patient, doctor and available date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fetchPatients = useServerFn(listMyPatients);
  const fetchDoctors = useServerFn(listDoctors);
  const fetchSpecialties = useServerFn(listSpecialties);
  const save = useServerFn(savePatient);
  const book = useServerFn(createAppointment);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [doctor, setDoctor] = useState<DoctorRow | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [day, setDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ appointment_number: string } | null>(null);

  const patients = useQuery({ queryKey: ["my-patients"], queryFn: () => fetchPatients() });
  const specialties = useQuery({ queryKey: ["specialties"], queryFn: () => fetchSpecialties() });
  const doctors = useQuery({
    queryKey: ["doctors", term, specialtyId, day],
    queryFn: () =>
      fetchDoctors({
        data: {
          term,
          specialtyId: specialtyId || null,
          day: day === "" ? null : Number(day),
          includeInactive: false,
        },
      }),
    enabled: step === 2,
  });

  const patient = (patients.data?.patients ?? []).find((p) => p.id === patientId) ?? null;
  const dates = useMemo(() => (doctor ? availableDates(doctor.days ?? []) : []), [doctor]);

  const savePatientMutation = useMutation({
    mutationFn: (input: unknown) => save({ data: input as never }),
    onSuccess: async (res: { id: string | null }) => {
      await queryClient.invalidateQueries({ queryKey: ["my-patients"] });
      if (res.id) setPatientId(res.id);
      setAddingNew(false);
      setStep(2);
    },
    onError: () => setError(t.p2.genericError),
  });

  const bookMutation = useMutation({
    mutationFn: (vars: { patientId: string; doctorId: string; date: string }) =>
      book({ data: vars }),
    onSuccess: async (res: { appointment: { appointment_number: string } }) => {
      setError(null);
      setConfirmed(res.appointment);
      await queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: (e: Error) => {
      setError(
        e.message.includes("DOCTOR_INACTIVE")
          ? t.p3.doctorInactiveError
          : e.message.includes("INVALID_DATE")
            ? t.p3.invalidDate
            : t.p2.genericError,
      );
    },
  });

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title={t.p3.bookAppointment} backTo="/dashboard" />
        <main className="mx-auto max-w-2xl px-4 py-10 text-center">
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="mt-3 text-xl font-bold text-foreground">{t.p3.appointmentConfirmed}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.p3.appointmentNumber}</p>
          <p className="text-2xl font-extrabold text-destructive" dir="ltr">
            {confirmed.appointment_number}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.navigate({ to: "/appointments" })}
              className="min-h-12 rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
            >
              {t.p3.myAppointments}
            </button>
            <button
              type="button"
              onClick={() => router.navigate({ to: "/dashboard" })}
              className="min-h-12 rounded-xl border-2 border-border px-5 font-semibold text-foreground"
            >
              {t.p3.backToDashboard}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const stepLabels = [t.p3.stepPatient, t.p3.stepDoctor, t.p3.stepDate, t.p3.stepReview];
  const inputClass =
    "w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t.p3.bookAppointment} backTo="/dashboard" />
      <main className="mx-auto max-w-2xl px-4 py-5">
        <ol className="mb-5 flex items-center gap-2">
          {stepLabels.map((label, index) => (
            <li
              key={label}
              className={`flex-1 rounded-full px-2 py-2 text-center text-xs font-semibold ${
                step === index + 1
                  ? "bg-primary text-primary-foreground"
                  : step > index + 1
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {label}
            </li>
          ))}
        </ol>

        {error && (
          <p className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {step === 1 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">{t.p3.choosePatient}</h2>
            {!addingNew && (
              <>
                <p className="text-xs text-muted-foreground">{t.p3.useExistingPatient}</p>
                {(patients.data?.patients ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPatientId(p.id)}
                    className={`w-full rounded-2xl border-2 p-4 text-start ${
                      patientId === p.id ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <span className="block text-base font-bold text-foreground">{p.full_name}</span>
                    <span className="block text-sm text-muted-foreground" dir="ltr">
                      {p.mobile} · {p.mr_number ?? t.p2.mrPending}
                    </span>
                    {p.is_self && (
                      <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {t.p2.selfBadge}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAddingNew(true)}
                  className="min-h-12 w-full rounded-xl border-2 border-primary px-5 font-semibold text-primary"
                >
                  {t.p2.otherPatient} / {t.p2.addPatient}
                </button>
                <button
                  type="button"
                  disabled={!patientId}
                  onClick={() => setStep(2)}
                  className="min-h-12 w-full rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {t.p3.next}
                </button>
              </>
            )}
            {addingNew && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">{t.p3.newPatient}</h3>
                <PatientForm
                  initial={emptyPatientForm}
                  initialIsSelf={false}
                  showWhoSelector
                  submitLabel={t.p3.next}
                  pending={savePatientMutation.isPending}
                  onCancel={() => setAddingNew(false)}
                  onSubmit={(values, isSelf) =>
                    savePatientMutation.mutate({
                      ...values,
                      age: Number(values.age),
                      is_self: isSelf,
                      relation: isSelf ? "self" : "other",
                    })
                  }
                />
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-3">
            <input
              className={inputClass}
              placeholder={t.p3.searchDoctorPlaceholder}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className={inputClass}
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
              >
                <option value="">{t.p3.allSpecialties}</option>
                {(specialties.data?.specialties ?? [])
                  .filter((s) => s.is_active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <select className={inputClass} value={day} onChange={(e) => setDay(e.target.value)}>
                <option value="">{t.p3.anyDay}</option>
                {t.p3.weekdays.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {doctors.isLoading && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.p2.loading}</p>
            )}
            {(doctors.data?.doctors ?? []).map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d as DoctorRow}
                actionLabel={t.p3.selectDoctor}
                onAction={() => {
                  setDoctor(d as DoctorRow);
                  setDate(null);
                  setStep(3);
                }}
              />
            ))}
            {!doctors.isLoading && (doctors.data?.doctors ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.p3.noDoctors}</p>
            )}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-12 w-full rounded-xl border-2 border-border px-5 font-semibold text-foreground"
            >
              {t.back}
            </button>
          </section>
        )}

        {step === 3 && doctor && (
          <section className="space-y-4">
            <DoctorCard doctor={doctor} />
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-bold text-foreground">{t.p3.appointmentDate}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t.p3.pickDate}</p>
              {dates.length === 0 ? (
                <p className="mt-3 text-sm font-medium text-destructive">{t.p3.noAvailableDays}</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {dates.map((iso) => {
                    const d = new Date(`${iso}T00:00:00`);
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setDate(iso)}
                        className={`min-h-16 rounded-xl border-2 p-2 text-center ${
                          date === iso
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground"
                        }`}
                      >
                        <span className="block text-xs">{t.p3.weekdaysShort[d.getDay()]}</span>
                        <span className="block text-base font-bold" dir="ltr">
                          {d.getDate()}/{d.getMonth() + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={!date}
                onClick={() => setStep(4)}
                className="min-h-12 flex-1 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t.p3.next}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-12 rounded-xl border-2 border-border px-5 font-semibold text-foreground"
              >
                {t.back}
              </button>
            </div>
          </section>
        )}

        {step === 4 && doctor && patient && date && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-bold text-foreground">{t.p3.reviewAppointment}</h2>
              <Row label={t.p2.fullName} value={patient.full_name} />
              <Row label={t.p2.relation} value={patient.guardian_name} />
              <Row label={t.p2.age} value={String(patient.age)} />
              <Row
                label={t.p2.gender}
                value={
                  patient.gender === "male" ? t.p2.male : patient.gender === "female" ? t.p2.female : t.p2.other
                }
              />
              <Row label={t.p2.mobile} value={patient.mobile} />
              <Row label={t.p2.mrNumber} value={patient.mr_number ?? t.p2.mrPending} />
              <hr className="my-3 border-border" />
              <Row label={t.p3.doctorName} value={doctor.name} />
              <Row label={t.p3.specialty} value={doctor.specialty_name} />
              <Row label={t.p3.qualification} value={doctor.qualification} />
              <Row label={t.p3.appointmentDate} value={date} />
              <Row label={t.p3.opdTiming} value={doctor.opd_timing} />
              <Row label={t.p3.fee} value={`Rs. ${doctor.fee}`} />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={bookMutation.isPending}
                onClick={() =>
                  bookMutation.mutate({ patientId: patient.id, doctorId: doctor.id, date })
                }
                className="min-h-12 flex-1 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60"
              >
                {bookMutation.isPending ? t.p3.booking : t.p3.confirmAppointment}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="min-h-12 rounded-xl border-2 border-border px-5 font-semibold text-foreground"
              >
                {t.back}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium text-foreground" dir="auto">
        {value || "—"}
      </span>
    </div>
  );
}

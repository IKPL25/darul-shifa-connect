import { useState } from "react";
import { genders, validateProfile, type ProfileField } from "@/lib/patient-schema";
import { useLanguage } from "@/lib/i18n";

export type PatientFormValues = Record<ProfileField, string>;

export const emptyPatientForm: PatientFormValues = {
  full_name: "",
  guardian_name: "",
  age: "",
  gender: "",
  mobile: "",
};

export function PatientForm({
  initial,
  initialIsSelf = true,
  showWhoSelector = false,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: PatientFormValues;
  initialIsSelf?: boolean;
  showWhoSelector?: boolean;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: PatientFormValues, isSelf: boolean) => void;
  onCancel?: () => void;
}) {
  const { t } = useLanguage();
  const [values, setValues] = useState<PatientFormValues>(initial);
  const [isSelf, setIsSelf] = useState(initialIsSelf);
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});

  const set = (field: ProfileField, value: string) =>
    setValues((v) => ({ ...v, [field]: value }));

  const labels: Record<ProfileField, string> = {
    full_name: t.p2.fullName,
    guardian_name: t.p2.relation,
    age: t.p2.age,
    gender: t.p2.gender,
    mobile: t.p2.mobile,
  };

  const errText = (field: ProfileField) => {
    const key = errors[field];
    if (!key) return null;
    return (t.p2.errors as Record<string, string>)[key] ?? t.p2.errors.required;
  };

  const inputClass = (field: ProfileField) =>
    `w-full rounded-xl border-2 bg-card px-4 py-3 text-base text-foreground outline-none ${
      errors[field] ? "border-destructive" : "border-border focus:border-primary"
    }`;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const found = validateProfile(values);
        setErrors(found);
        if (Object.keys(found).length === 0) onSubmit(values, isSelf);
      }}
      className="space-y-4"
    >
      {showWhoSelector && (
        <div>
          <span className="mb-2 block text-sm font-semibold text-foreground">{t.p2.appointmentFor}</span>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: true, label: t.p2.self },
              { key: false, label: t.p2.otherPatient },
            ].map((option) => (
              <button
                key={String(option.key)}
                type="button"
                onClick={() => setIsSelf(option.key)}
                className={`min-h-12 rounded-xl border-2 px-4 font-semibold ${
                  isSelf === option.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(["full_name", "guardian_name"] as ProfileField[]).map((field) => (
        <div key={field}>
          <label className="mb-1 block text-sm font-semibold text-foreground">{labels[field]}</label>
          <input
            className={inputClass(field)}
            value={values[field]}
            onChange={(e) => set(field, e.target.value)}
          />
          {errText(field) && <p className="mt-1 text-xs font-medium text-destructive">{errText(field)}</p>}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">{labels.age}</label>
          <input
            inputMode="numeric"
            className={inputClass("age")}
            value={values.age}
            onChange={(e) => set("age", e.target.value)}
          />
          {errText("age") && <p className="mt-1 text-xs font-medium text-destructive">{errText("age")}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">{labels.gender}</label>
          <select
            className={inputClass("gender")}
            value={values.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="">—</option>
            {genders.map((g) => (
              <option key={g} value={g}>
                {g === "male" ? t.p2.male : g === "female" ? t.p2.female : t.p2.other}
              </option>
            ))}
          </select>
          {errText("gender") && <p className="mt-1 text-xs font-medium text-destructive">{errText("gender")}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-foreground">{labels.mobile}</label>
        <input
          inputMode="tel"
          dir="ltr"
          placeholder="0300-1234567"
          className={inputClass("mobile")}
          value={values.mobile}
          onChange={(e) => set("mobile", e.target.value)}
        />
        {errText("mobile") && <p className="mt-1 text-xs font-medium text-destructive">{errText("mobile")}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 flex-1 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? t.p2.saving : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-xl border-2 border-border px-5 font-semibold text-foreground"
          >
            {t.p2.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

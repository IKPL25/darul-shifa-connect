import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "ur";

const STORAGE_KEY = "dsgh.lang";

export const strings = {
  en: {
    hospital: "Darul Shifa General Hospital",
    portal: "Appointment Portal",
    chooseLanguage: "Choose your language",
    languageNote: "You can change this later from the header.",
    english: "English",
    urdu: "اردو",
    continue: "Continue",
    selectRole: "Select your role",
    selectRoleNote: "Phase 1 foundation — sign-in arrives in the next phase.",
    patient: "Patient",
    admin: "Admin",
    masterAdmin: "Master Admin",
    back: "Back",
    comingSoon: "Coming in next phase",
    contact: "Contact",
    address: "Near Nad-e-Ali Square, J.T.C.H.S., Malir, Karachi",
    patientTitle: "Patient Portal",
    adminTitle: "Admin Portal",
    masterTitle: "Master Admin Portal",
    menu: {
      bookAppointment: "Book Appointment",
      myAppointments: "My Appointments",
      appointmentStatus: "Appointment Status",
      mySlips: "My Slips",
      myProfile: "My Profile",
      notifications: "Notifications",
      dashboard: "Dashboard",
      appointments: "Appointments",
      patients: "Patients",
      doctors: "Doctors",
      payments: "Payments",
      slips: "Slips",
      reports: "Reports",
      settings: "Settings",
      adminManagement: "Admin Management",
      permissions: "Permissions",
      paymentSettings: "Payment Settings",
      backup: "Backup",
      systemSettings: "System Settings",
    },
  },
  ur: {
    hospital: "دارالشفاء جنرل ہسپتال",
    portal: "اپائنٹمنٹ پورٹل",
    chooseLanguage: "اپنی زبان منتخب کریں",
    languageNote: "آپ بعد میں ہیڈر سے زبان تبدیل کر سکتے ہیں۔",
    english: "English",
    urdu: "اردو",
    continue: "جاری رکھیں",
    selectRole: "اپنا کردار منتخب کریں",
    selectRoleNote: "فیز 1 بنیاد — لاگ اِن اگلے مرحلے میں آئے گا۔",
    patient: "مریض",
    admin: "ایڈمن",
    masterAdmin: "ماسٹر ایڈمن",
    back: "واپس",
    comingSoon: "اگلے مرحلے میں دستیاب ہوگا",
    contact: "رابطہ",
    address: "نزد ناد علی چوک، جے۔ٹی۔سی۔ایچ۔ایس، ملیر، کراچی",
    patientTitle: "مریض پورٹل",
    adminTitle: "ایڈمن پورٹل",
    masterTitle: "ماسٹر ایڈمن پورٹل",
    menu: {
      bookAppointment: "اپائنٹمنٹ بک کریں",
      myAppointments: "میری اپائنٹمنٹس",
      appointmentStatus: "اپائنٹمنٹ کی صورتحال",
      mySlips: "میری پرچیاں",
      myProfile: "میری پروفائل",
      notifications: "اطلاعات",
      dashboard: "ڈیش بورڈ",
      appointments: "اپائنٹمنٹس",
      patients: "مریض",
      doctors: "ڈاکٹرز",
      payments: "ادائیگیاں",
      slips: "پرچیاں",
      reports: "رپورٹس",
      settings: "ترتیبات",
      adminManagement: "ایڈمن مینجمنٹ",
      permissions: "اجازتیں",
      paymentSettings: "ادائیگی کی ترتیبات",
      backup: "بیک اپ",
      systemSettings: "سسٹم سیٹنگز",
    },
  },
} as const;

export type Strings = (typeof strings)["en"];

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
  dir: "ltr" | "rtl";
  hasChosen: boolean;
  ready: boolean;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [hasChosen, setHasChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ur") {
      setLangState(saved);
      setHasChosen(true);
    }
    setReady(true);
  }, []);

  const setLang = useCallback((l: Lang) => {
    window.localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
    setHasChosen(true);
  }, []);

  const dir = lang === "ur" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: strings[lang], dir, hasChosen, ready }),
    [lang, setLang, dir, hasChosen, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
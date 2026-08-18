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
    p2: {
      signIn: "Sign in with Google",
      signInNote: "Sign in securely with your Gmail account. We never ask for your password.",
      patientLogin: "Patient Login",
      signingIn: "Signing in…",
      signOut: "Sign out",
      welcome: "Welcome",
      dashboard: "Patient Dashboard",
      register: "Patient Registration",
      registerNote: "Please complete your profile to continue.",
      profile: "Patient Profile",
      editProfile: "Edit Profile",
      saveChanges: "Save Changes",
      saving: "Saving…",
      cancel: "Cancel",
      profileUpdated: "Profile Updated Successfully",
      profileCreated: "Profile Created Successfully",
      mrNumber: "MR Number",
      mrPending: "Not assigned yet",
      mrNote: "The MR Number is assigned by hospital administration only.",
      email: "Email",
      fullName: "Patient Name",
      guardianName: "Father / Husband Name",
      age: "Age",
      gender: "Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      mobile: "Mobile Number",
      cnic: "CNIC",
      address: "Address",
      findRecord: "Find My Record",
      findRecordNote: "Enter your Mobile Number or MR Number to confirm your hospital record.",
      search: "Search",
      recordFound: "Record verified — this is your record.",
      recordNotFound: "No record of yours matches this. You can only view your own record.",
      patientRecords: "Patient Records",
      searchPatients: "Search by MR Number, Mobile or Name",
      assignMr: "Assign MR Number",
      assign: "Assign",
      assigned: "MR Number assigned successfully",
      noResults: "No patients found",
      staffOnly: "This area is for Admin and Master Admin only.",
      loading: "Loading…",
      genericError: "Something went wrong. Please try again.",
      errors: {
        required: "This field is required",
        age: "Enter a valid age (0-120)",
        mobile: "Enter a valid mobile number, e.g. 0300-1234567",
        cnic: "Enter a valid CNIC, e.g. 42101-1234567-1",
        mr: "MR Number must look like MR-000001",
        duplicateMr: "This MR Number is already used",
      },
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
    p2: {
      signIn: "گوگل سے سائن اِن کریں",
      signInNote: "اپنے جی میل اکاؤنٹ سے محفوظ طریقے سے سائن اِن کریں۔ ہم کبھی پاس ورڈ نہیں پوچھتے۔",
      patientLogin: "مریض لاگ اِن",
      signingIn: "سائن اِن ہو رہا ہے…",
      signOut: "سائن آؤٹ",
      welcome: "خوش آمدید",
      dashboard: "مریض ڈیش بورڈ",
      register: "مریض رجسٹریشن",
      registerNote: "جاری رکھنے کے لیے اپنی پروفائل مکمل کریں۔",
      profile: "مریض کا پروفائل",
      editProfile: "پروفائل میں ترمیم",
      saveChanges: "تبدیلیاں محفوظ کریں",
      saving: "محفوظ ہو رہا ہے…",
      cancel: "منسوخ کریں",
      profileUpdated: "پروفائل کامیابی سے اپ ڈیٹ ہو گئی",
      profileCreated: "پروفائل کامیابی سے بن گئی",
      mrNumber: "ایم آر نمبر",
      mrPending: "ابھی جاری نہیں ہوا",
      mrNote: "ایم آر نمبر صرف ہسپتال انتظامیہ جاری کرتی ہے۔",
      email: "ای میل",
      fullName: "مریض کا نام",
      guardianName: "والد / شوہر کا نام",
      age: "عمر",
      gender: "جنس",
      male: "مرد",
      female: "عورت",
      other: "دیگر",
      mobile: "موبائل نمبر",
      cnic: "شناختی کارڈ نمبر",
      address: "پتہ",
      findRecord: "میرا ریکارڈ تلاش کریں",
      findRecordNote: "اپنا موبائل نمبر یا ایم آر نمبر درج کریں تاکہ ریکارڈ کی تصدیق ہو سکے۔",
      search: "تلاش کریں",
      recordFound: "ریکارڈ کی تصدیق ہو گئی — یہ آپ کا ریکارڈ ہے۔",
      recordNotFound: "اس سے مماثل آپ کا کوئی ریکارڈ نہیں ملا۔ آپ صرف اپنا ریکارڈ دیکھ سکتے ہیں۔",
      patientRecords: "مریضوں کے ریکارڈ",
      searchPatients: "ایم آر نمبر، موبائل یا نام سے تلاش کریں",
      assignMr: "ایم آر نمبر جاری کریں",
      assign: "جاری کریں",
      assigned: "ایم آر نمبر کامیابی سے جاری ہو گیا",
      noResults: "کوئی مریض نہیں ملا",
      staffOnly: "یہ حصہ صرف ایڈمن اور ماسٹر ایڈمن کے لیے ہے۔",
      loading: "لوڈ ہو رہا ہے…",
      genericError: "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔",
      errors: {
        required: "یہ خانہ ضروری ہے",
        age: "درست عمر درج کریں (0-120)",
        mobile: "درست موبائل نمبر درج کریں، مثلاً 0300-1234567",
        cnic: "درست شناختی کارڈ نمبر درج کریں، مثلاً 42101-1234567-1",
        mr: "ایم آر نمبر اس طرح ہونا چاہیے: MR-000001",
        duplicateMr: "یہ ایم آر نمبر پہلے سے استعمال میں ہے",
      },
    },
  },
};

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
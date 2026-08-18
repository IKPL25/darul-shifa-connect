import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, CalendarDays, Activity, ReceiptText, UserCircle, Bell } from "lucide-react";
import { PortalScreen } from "@/components/PortalScreen";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Patient Portal | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Patient area of the Darul Shifa General Hospital Appointment Portal: appointments, slips, profile and notifications.",
      },
      { property: "og:title", content: "Patient Portal | Darul Shifa Hospital" },
      {
        property: "og:description",
        content: "Patient area for appointments, slips and notifications.",
      },
    ],
  }),
  component: PatientPage,
});

function PatientPage() {
  const { t } = useLanguage();
  return (
    <PortalScreen
      title={t.patientTitle}
      items={[
        { key: "book", label: t.menu.bookAppointment, icon: CalendarPlus },
        { key: "mine", label: t.menu.myAppointments, icon: CalendarDays },
        { key: "status", label: t.menu.appointmentStatus, icon: Activity },
        { key: "slips", label: t.menu.mySlips, icon: ReceiptText },
        { key: "profile", label: t.menu.myProfile, icon: UserCircle },
        { key: "notif", label: t.menu.notifications, icon: Bell },
      ]}
    />
  );
}
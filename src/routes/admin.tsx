import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  CreditCard,
  ReceiptText,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";
import { PortalScreen } from "@/components/PortalScreen";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Admin foundation area of the Darul Shifa General Hospital Appointment Portal: appointments, patients, doctors and settings.",
      },
      { property: "og:title", content: "Admin Portal | Darul Shifa Hospital" },
      {
        property: "og:description",
        content: "Hospital admin area for appointments, patients and doctors.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useLanguage();
  return (
    <PortalScreen
      title={t.adminTitle}
      items={[
        { key: "dash", label: t.menu.dashboard, icon: LayoutDashboard },
        { key: "appt", label: t.menu.appointments, icon: CalendarDays },
        { key: "patients", label: t.menu.patients, icon: Users },
        { key: "doctors", label: t.menu.doctors, icon: Stethoscope },
        { key: "payments", label: t.menu.payments, icon: CreditCard },
        { key: "slips", label: t.menu.slips, icon: ReceiptText },
        { key: "reports", label: t.menu.reports, icon: BarChart3 },
        { key: "notif", label: t.menu.notifications, icon: Bell },
        { key: "settings", label: t.menu.settings, icon: Settings },
      ]}
    />
  );
}
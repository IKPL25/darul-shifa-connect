import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  CreditCard,
  ReceiptText,
  BarChart3,
  UserCog,
  KeyRound,
  Wallet,
  DatabaseBackup,
  Bell,
  Settings,
} from "lucide-react";
import { PortalScreen } from "@/components/PortalScreen";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/master-admin")({
  head: () => ({
    meta: [
      { title: "Master Admin | Darul Shifa Hospital" },
      {
        name: "description",
        content:
          "Master Admin foundation area of the Darul Shifa General Hospital Appointment Portal: admin management, permissions, backup and system settings.",
      },
      { property: "og:title", content: "Master Admin | Darul Shifa Hospital" },
      {
        property: "og:description",
        content: "Master admin area for permissions, backup and system settings.",
      },
    ],
  }),
  component: MasterAdminPage,
});

function MasterAdminPage() {
  const { t } = useLanguage();
  return (
    <PortalScreen
      title={t.masterTitle}
      items={[
        { key: "dash", label: t.menu.dashboard, icon: LayoutDashboard },
        { key: "appt", label: t.menu.appointments, icon: CalendarDays, to: "/admin-appointments" },
        { key: "patients", label: t.menu.patients, icon: Users, to: "/patient-records" },
        { key: "doctors", label: t.menu.doctors, icon: Stethoscope, to: "/doctors" },
        { key: "payments", label: t.menu.payments, icon: CreditCard },
        { key: "slips", label: t.menu.slips, icon: ReceiptText },
        { key: "reports", label: t.menu.reports, icon: BarChart3 },
        { key: "adminmgmt", label: t.menu.adminManagement, icon: UserCog },
        { key: "perms", label: t.menu.permissions, icon: KeyRound },
        { key: "paysettings", label: t.menu.paymentSettings, icon: Wallet },
        { key: "backup", label: t.menu.backup, icon: DatabaseBackup },
        { key: "notif", label: t.menu.notifications, icon: Bell },
        { key: "sys", label: t.menu.systemSettings, icon: Settings },
      ]}
    />
  );
}
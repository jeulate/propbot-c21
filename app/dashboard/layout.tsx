import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/login");

  return (
    <DashboardShell nombre={sesion.nombre} rol={sesion.rol}>
      {children}
    </DashboardShell>
  );
}

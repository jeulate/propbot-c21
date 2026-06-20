import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { BarraNavegacion } from "@/components/barra-navegacion";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/login");

  return (
    <div className="flex min-h-screen bg-carbon-950">
      <BarraNavegacion nombre={sesion.nombre} rol={sesion.rol} />
      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-20 sm:px-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}

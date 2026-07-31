import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

export default async function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesionActual();

  if (!sesion || !PERMISOS[sesion.rol].gestionarAsesores) {
    redirect("/dashboard");
  }

  return children;
}

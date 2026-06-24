import { redirect } from "next/navigation";
import { listarAsesores } from "@/lib/repositories/asesores";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { GestionAsesores } from "@/components/gestion-asesores";

export default async function AsesoresPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarAsesores) redirect("/dashboard");

  const asesores = await listarAsesores();
  const categorias = await listarCategoriasAsesor();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">Asesores autorizados</h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Solo los asesores en esta lista pueden registrar cierres a través del bot de Telegram.
        </p>
      </header>

      <GestionAsesores asesoresIniciales={asesores} categoriasIniciales={categorias} />
    </div>
  );
}

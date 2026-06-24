import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { GestionCategorias } from "@/components/gestion-categorias";

export default async function ConfiguracionPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarAsesores) redirect("/dashboard");

  const categorias = await listarCategoriasAsesor();
  const configuracion = await obtenerConfiguracionComisiones();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">Configuracion</h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Define categorias y porcentaje de comision para calcular el pago real de los asesores.
        </p>
      </header>

      <GestionCategorias
        categoriasIniciales={categorias}
        porcentajeOficinaNacionalInicial={configuracion.porcentajeOficinaNacional}
      />
    </div>
  );
}
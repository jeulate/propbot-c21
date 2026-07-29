import { redirect } from "next/navigation";
import { FormularioAsesor } from "@/components/formulario-asesor";
import { obtenerSesionActual } from "@/lib/auth";
import { listarAgrupaciones } from "@/lib/repositories/agrupaciones-asesor";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { PERMISOS } from "@/types/domain";

export default async function CrearAsesorPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarAsesores)
    redirect("/dashboard");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">
          Registrar asesor
        </h1>
        <p className="mt-1 text-sm text-carbon-500">
          Completa la información personal y organizacional del nuevo asesor.
        </p>
      </header>
      <FormularioAsesor
        categorias={await listarCategoriasAsesor()}
        agrupaciones={await listarAgrupaciones()}
        nombreOficina={(await obtenerConfiguracionComisiones()).nombreOficina}
      />
    </div>
  );
}

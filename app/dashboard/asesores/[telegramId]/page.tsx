import { notFound, redirect } from "next/navigation";
import { FormularioAsesor } from "@/components/formulario-asesor";
import { obtenerSesionActual } from "@/lib/auth";
import { listarAgrupaciones } from "@/lib/repositories/agrupaciones-asesor";
import { obtenerAsesor } from "@/lib/repositories/asesores";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { PERMISOS } from "@/types/domain";

export default async function PerfilAsesorPage({
  params,
}: {
  params: { telegramId: string };
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarAsesores)
    redirect("/dashboard");
  const asesor = await obtenerAsesor(decodeURIComponent(params.telegramId));
  if (!asesor) notFound();
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-700">
            Perfil administrativo
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">
            {asesor.nombre}
          </h1>
          <p className="mt-1 text-sm text-carbon-500">
            Datos personales y estructura organizacional del asesor.
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${asesor.activo ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-danger/15 text-signal-danger"}`}
        >
          {asesor.activo ? "Asesor activo" : "Asesor inactivo"}
        </span>
      </header>
      <FormularioAsesor
        asesor={asesor}
        categorias={await listarCategoriasAsesor()}
        agrupaciones={await listarAgrupaciones()}
        nombreOficina={(await obtenerConfiguracionComisiones()).nombreOficina}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { listarAsesores } from "@/lib/repositories/asesores";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { GestionAsesores } from "@/components/gestion-asesores";
import { listarAgrupaciones } from "@/lib/repositories/agrupaciones-asesor";
import Link from "next/link";

export default async function AsesoresPage({
  searchParams,
}: {
  searchParams?: { creado?: string };
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarAsesores)
    redirect("/dashboard");

  const asesores = await listarAsesores();
  const categorias = await listarCategoriasAsesor();
  const agrupaciones = await listarAgrupaciones();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
            Asesores autorizados
          </h1>
          <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
            Solo los asesores en esta lista pueden registrar cierres a través
            del bot de Telegram.
          </p>
        </div>
        <Link
          href="/dashboard/asesores/crear"
          className="rounded-md bg-gold-500 px-4 py-2.5 text-center text-sm font-medium text-carbon-950"
        >
          Registrar asesor
        </Link>
      </header>

      <GestionAsesores
        asesoresIniciales={asesores}
        categoriasIniciales={categorias}
        agrupacionesIniciales={agrupaciones}
        mensajeInicial={
          searchParams?.creado === "1"
            ? "Asesor registrado correctamente."
            : undefined
        }
      />
    </div>
  );
}

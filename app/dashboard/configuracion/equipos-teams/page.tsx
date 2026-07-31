import { GestionAgrupacionesAsesores } from "@/components/gestion-agrupaciones-asesores";
import { listarAgrupaciones } from "@/lib/repositories/agrupaciones-asesor";
import { listarAsesores } from "@/lib/repositories/asesores";

export default async function EquiposTeamsPage() {
  const [agrupaciones, asesores] = await Promise.all([
    listarAgrupaciones(),
    listarAsesores(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Equipos y Teams
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Organiza los equipos Triple 21, los Teams y sus integrantes.
        </p>
      </header>

      <GestionAgrupacionesAsesores
        agrupacionesIniciales={agrupaciones}
        asesoresIniciales={asesores}
      />
    </div>
  );
}

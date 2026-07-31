import { GestionCategorias } from "@/components/gestion-categorias";
import { GestionComisionesTeam } from "@/components/gestion-comisiones-team";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";

export default async function CategoriasComisionesPage() {
  const [categorias, configuracion] = await Promise.all([
    listarCategoriasAsesor(),
    obtenerConfiguracionComisiones(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Categorías y Comisiones
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Define las categorías de asesores y la distribución de comisiones
          para integrantes de Team.
        </p>
      </header>

      <GestionCategorias
        categoriasIniciales={categorias}
        porcentajeOficinaNacionalInicial={
          configuracion.porcentajeOficinaNacional
        }
      />
      <GestionComisionesTeam
        categorias={categorias}
        configuracionesIniciales={configuracion.comisionesTeamPorCategoria}
      />
    </div>
  );
}

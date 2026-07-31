import { GestionMetas } from "@/components/gestion-metas";
import { GestionObjetivosOficina } from "@/components/gestion-objetivos-oficina";
import { GestionOficina } from "@/components/gestion-oficina";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { listarMetasMensuales } from "@/lib/repositories/metas-mensuales";
import { obtenerObjetivosOficina } from "@/lib/repositories/objetivos-oficina";

export default async function ConfiguracionPage() {
  const [configuracion, metas, objetivosOficina] = await Promise.all([
    obtenerConfiguracionComisiones(),
    listarMetasMensuales(),
    obtenerObjetivosOficina(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Configuración general
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Administra la información global, las metas mensuales y los objetivos
          anuales de la oficina.
        </p>
      </header>

      <GestionOficina nombreInicial={configuracion.nombreOficina ?? ""} />
      <GestionMetas metasIniciales={metas} />
      <GestionObjetivosOficina objetivosIniciales={objetivosOficina} />
    </div>
  );
}

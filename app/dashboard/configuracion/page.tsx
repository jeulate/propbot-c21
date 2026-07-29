import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { GestionCategorias } from "@/components/gestion-categorias";
import { GestionMetas } from "@/components/gestion-metas";
import { listarMetasMensuales } from "@/lib/repositories/metas-mensuales";
import { GestionCuentaComision } from "@/components/gestion-cuenta-comision";
import { obtenerCuentaComision } from "@/lib/repositories/cuenta-comision";
import { GestionCaptacionesMensuales } from "@/components/gestion-captaciones-mensuales";
import { listarAsesores } from "@/lib/repositories/asesores";
import { listarCaptacionesMensuales } from "@/lib/repositories/captaciones-mensuales";
import { GestionObjetivosOficina } from "@/components/gestion-objetivos-oficina";
import { obtenerObjetivosOficina } from "@/lib/repositories/objetivos-oficina";
import { listarAgrupaciones } from "@/lib/repositories/agrupaciones-asesor";
import { GestionAgrupacionesAsesores } from "@/components/gestion-agrupaciones-asesores";
import { GestionOficina } from "@/components/gestion-oficina";

export default async function ConfiguracionPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarAsesores)
    redirect("/dashboard");

  const categorias = await listarCategoriasAsesor();
  const configuracion = await obtenerConfiguracionComisiones();
  const metas = await listarMetasMensuales();
  const cuentaComision = await obtenerCuentaComision();
  const asesores = await listarAsesores();
  const captaciones = await listarCaptacionesMensuales();
  const objetivosOficina = await obtenerObjetivosOficina();
  const agrupaciones = await listarAgrupaciones();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Configuracion
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Define categorias y porcentaje de comision para calcular el pago real
          de los asesores.
        </p>
      </header>

      <GestionCategorias
        categoriasIniciales={categorias}
        porcentajeOficinaNacionalInicial={
          configuracion.porcentajeOficinaNacional
        }
      />
      <GestionOficina nombreInicial={configuracion.nombreOficina ?? ""} />
      <GestionAgrupacionesAsesores
        agrupacionesIniciales={agrupaciones}
        asesoresIniciales={asesores}
      />
      <GestionCaptacionesMensuales
        asesores={asesores}
        captacionesIniciales={captaciones}
      />
      <GestionMetas metasIniciales={metas} />
      <GestionObjetivosOficina objetivosIniciales={objetivosOficina} />
      <GestionCuentaComision cuentaInicial={cuentaComision} />
    </div>
  );
}

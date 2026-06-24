import { kv, KEYS } from "@/lib/redis";
import type { ConfiguracionComisiones } from "@/types/domain";

const PORCENTAJE_OFICINA_NACIONAL_POR_DEFECTO = 8;

export async function obtenerConfiguracionComisiones(): Promise<ConfiguracionComisiones> {
  const guardada = await kv.get<ConfiguracionComisiones>(KEYS.configuracionComisiones);
  if (guardada) return guardada;

  const inicial: ConfiguracionComisiones = {
    porcentajeOficinaNacional: PORCENTAJE_OFICINA_NACIONAL_POR_DEFECTO,
    actualizadoEn: new Date().toISOString(),
  };

  await kv.set(KEYS.configuracionComisiones, inicial);
  return inicial;
}

export async function actualizarPorcentajeOficinaNacional(
  porcentajeOficinaNacional: number
): Promise<ConfiguracionComisiones> {
  if (porcentajeOficinaNacional < 0 || porcentajeOficinaNacional > 100) {
    throw new Error("El porcentaje de Oficina Nacional debe estar entre 0 y 100.");
  }

  const configuracion: ConfiguracionComisiones = {
    porcentajeOficinaNacional,
    actualizadoEn: new Date().toISOString(),
  };

  await kv.set(KEYS.configuracionComisiones, configuracion);
  return configuracion;
}

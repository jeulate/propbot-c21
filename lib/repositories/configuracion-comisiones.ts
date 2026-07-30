import { kv, KEYS } from "@/lib/redis";
import type { ConfiguracionComisiones } from "@/types/domain";

const PORCENTAJE_OFICINA_NACIONAL_POR_DEFECTO = 8;
const PORCENTAJE_OFICINA_TEAM_POR_DEFECTO = 21.8;
const PORCENTAJE_TEAM_LEADER_POR_DEFECTO = 4.6;

function completarConfiguracion(
  configuracion: ConfiguracionComisiones,
): ConfiguracionComisiones {
  return {
    ...configuracion,
    porcentajeOficinaTeam:
      configuracion.porcentajeOficinaTeam ??
      PORCENTAJE_OFICINA_TEAM_POR_DEFECTO,
    porcentajeTeamLeader:
      configuracion.porcentajeTeamLeader ?? PORCENTAJE_TEAM_LEADER_POR_DEFECTO,
  };
}

export async function obtenerConfiguracionComisiones(): Promise<ConfiguracionComisiones> {
  const guardada = await kv.get<ConfiguracionComisiones>(
    KEYS.configuracionComisiones,
  );
  if (guardada) return completarConfiguracion(guardada);

  const inicial: ConfiguracionComisiones = {
    porcentajeOficinaNacional: PORCENTAJE_OFICINA_NACIONAL_POR_DEFECTO,
    porcentajeOficinaTeam: PORCENTAJE_OFICINA_TEAM_POR_DEFECTO,
    porcentajeTeamLeader: PORCENTAJE_TEAM_LEADER_POR_DEFECTO,
    nombreOficina: "",
    actualizadoEn: new Date().toISOString(),
  };

  await kv.set(KEYS.configuracionComisiones, inicial);
  return inicial;
}

export async function actualizarPorcentajeOficinaNacional(
  porcentajeOficinaNacional: number,
): Promise<ConfiguracionComisiones> {
  if (
    !Number.isFinite(porcentajeOficinaNacional) ||
    porcentajeOficinaNacional < 0 ||
    porcentajeOficinaNacional > 100
  ) {
    throw new Error(
      "El porcentaje de Oficina Nacional debe estar entre 0 y 100.",
    );
  }

  const valorRedondeado = Math.round(porcentajeOficinaNacional * 100) / 100;

  if (Math.abs(porcentajeOficinaNacional - valorRedondeado) >= 1e-9) {
    throw new Error(
      "El porcentaje de Oficina Nacional admite hasta dos decimales.",
    );
  }

  const actual = await obtenerConfiguracionComisiones();
  const configuracion: ConfiguracionComisiones = {
    ...actual,
    porcentajeOficinaNacional: valorRedondeado,
    actualizadoEn: new Date().toISOString(),
  };

  await kv.set(KEYS.configuracionComisiones, configuracion);
  return configuracion;
}

export async function actualizarPorcentajesTeam(
  porcentajeOficinaTeam: number,
  porcentajeTeamLeader: number,
): Promise<ConfiguracionComisiones> {
  for (const porcentaje of [porcentajeOficinaTeam, porcentajeTeamLeader]) {
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      throw new Error("Los porcentajes de Team deben estar entre 0 y 100.");
    }

    const valorRedondeado = Math.round(porcentaje * 100) / 100;

    if (Math.abs(porcentaje - valorRedondeado) >= 1e-9) {
      throw new Error("Los porcentajes admiten hasta dos decimales.");
    }
  }

  if (porcentajeOficinaTeam + porcentajeTeamLeader > 100) {
    throw new Error("La suma de los porcentajes de Team no puede superar 100.");
  }

  const porcentajeOficinaTeamNormalizado =
    Math.round(porcentajeOficinaTeam * 100) / 100;

  const porcentajeTeamLeaderNormalizado =
    Math.round(porcentajeTeamLeader * 100) / 100;

  const actual = await obtenerConfiguracionComisiones();
  const configuracion: ConfiguracionComisiones = {
    ...actual,
    porcentajeOficinaTeam: porcentajeOficinaTeamNormalizado,
    porcentajeTeamLeader: porcentajeTeamLeaderNormalizado,
    actualizadoEn: new Date().toISOString(),
  };

  await kv.set(KEYS.configuracionComisiones, configuracion);
  return configuracion;
}

export async function actualizarNombreOficina(
  nombreOficina: string,
): Promise<ConfiguracionComisiones> {
  const nombre = nombreOficina.trim();
  if (nombre.length < 2 || nombre.length > 120) {
    throw new Error(
      "El nombre de la oficina debe tener entre 2 y 120 caracteres.",
    );
  }
  const actual = await obtenerConfiguracionComisiones();
  const configuracion = {
    ...actual,
    nombreOficina: nombre,
    actualizadoEn: new Date().toISOString(),
  };
  await kv.set(KEYS.configuracionComisiones, configuracion);
  return configuracion;
}

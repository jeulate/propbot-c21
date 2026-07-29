import { nanoid } from "nanoid";
import { kv, KEYS } from "@/lib/redis";
import type {
  AgrupacionAsesor,
  AsesorAutorizado,
  TipoAgrupacionAsesor,
} from "@/types/domain";

const LIMITES: Record<TipoAgrupacionAsesor, number> = {
  TEAM: 4,
  EQUIPO_TRIPLE_21: 5,
};

async function obtenerAsesorLocal(
  telegramId: string,
): Promise<AsesorAutorizado | null> {
  return (await kv.get<AsesorAutorizado>(KEYS.asesor(telegramId))) ?? null;
}

async function listarAsesoresLocal(): Promise<AsesorAutorizado[]> {
  const ids = await kv.smembers(KEYS.asesoresIndex);
  const asesores = await Promise.all((ids ?? []).map(obtenerAsesorLocal));
  return asesores.filter((item): item is AsesorAutorizado => item !== null);
}

export async function obtenerAgrupacion(
  id: string,
): Promise<AgrupacionAsesor | null> {
  return (await kv.get<AgrupacionAsesor>(KEYS.agrupacionAsesor(id))) ?? null;
}

export async function listarAgrupaciones(): Promise<AgrupacionAsesor[]> {
  const ids = await kv.smembers(KEYS.agrupacionesAsesorIndex);
  if (!ids?.length) return [];
  const agrupaciones = await Promise.all(ids.map(obtenerAgrupacion));
  return agrupaciones
    .filter((item): item is AgrupacionAsesor => item !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function crearAgrupacion(params: {
  nombre: string;
  tipo: TipoAgrupacionAsesor;
}): Promise<AgrupacionAsesor> {
  const existentes = await listarAgrupaciones();
  const delTipo = existentes.filter((item) => item.tipo === params.tipo);
  if (delTipo.length >= LIMITES[params.tipo]) {
    throw new Error(
      params.tipo === "TEAM"
        ? "Solo se pueden registrar 4 Teams."
        : "Solo se pueden registrar 5 Equipos Triple 21.",
    );
  }

  const nombre = params.nombre.trim().replace(/\s+/g, " ");
  if (
    delTipo.some(
      (item) =>
        item.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"),
    )
  ) {
    throw new Error(
      "Ya existe una agrupación de este tipo con el mismo nombre.",
    );
  }

  const ahora = new Date().toISOString();
  const agrupacion: AgrupacionAsesor = {
    id: nanoid(),
    nombre,
    tipo: params.tipo,
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  await kv.set(KEYS.agrupacionAsesor(agrupacion.id), agrupacion);
  await kv.sadd(KEYS.agrupacionesAsesorIndex, agrupacion.id);
  return agrupacion;
}

export async function actualizarAgrupacion(
  id: string,
  cambios: {
    nombre?: string;
    activo?: boolean;
    responsableTelegramId?: string | null;
  },
): Promise<{ agrupacion: AgrupacionAsesor; asesores: AsesorAutorizado[] }> {
  const actual = await obtenerAgrupacion(id);
  if (!actual) throw new Error("La agrupación no existe.");

  const agrupaciones = await listarAgrupaciones();
  const nombre = cambios.nombre?.trim().replace(/\s+/g, " ");
  if (
    nombre &&
    agrupaciones.some(
      (item) =>
        item.id !== id &&
        item.tipo === actual.tipo &&
        item.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"),
    )
  ) {
    throw new Error(
      "Ya existe una agrupación de este tipo con el mismo nombre.",
    );
  }

  let responsableTelegramId = actual.responsableTelegramId;
  if (cambios.responsableTelegramId !== undefined) {
    responsableTelegramId = cambios.responsableTelegramId || undefined;
    if (responsableTelegramId) {
      const asesor = await obtenerAsesorLocal(responsableTelegramId);
      if (!asesor || !asesor.activo) {
        throw new Error("El responsable debe ser un asesor activo.");
      }
      const actualizado =
        actual.tipo === "TEAM"
          ? { ...asesor, teamId: actual.id }
          : { ...asesor, equipoTriple21Id: actual.id };
      await kv.set(KEYS.asesor(asesor.telegramId), actualizado);
    }
  }

  const actualizado: AgrupacionAsesor = {
    ...actual,
    ...(nombre ? { nombre } : {}),
    ...(cambios.activo !== undefined ? { activo: cambios.activo } : {}),
    responsableTelegramId,
    actualizadoEn: new Date().toISOString(),
  };
  await kv.set(KEYS.agrupacionAsesor(id), actualizado);
  return { agrupacion: actualizado, asesores: await listarAsesoresLocal() };
}

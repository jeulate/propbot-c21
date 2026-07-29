import { kv, KEYS } from "@/lib/redis";
import type { AsesorAutorizado } from "@/types/domain";
import { obtenerCategoriaAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerAgrupacion } from "@/lib/repositories/agrupaciones-asesor";

/**
 * Repositorio de la whitelist de asesores autorizados a usar el bot de Telegram.
 * Solo los administradores pueden agregar/desactivar asesores desde el dashboard.
 */

export async function obtenerAsesor(
  telegramId: string,
): Promise<AsesorAutorizado | null> {
  return (await kv.get<AsesorAutorizado>(KEYS.asesor(telegramId))) ?? null;
}

export async function esAsesorAutorizado(telegramId: string): Promise<boolean> {
  const asesor = await obtenerAsesor(telegramId);
  return !!asesor && asesor.activo;
}

export async function registrarAsesor(params: {
  telegramId: string;
  nombre: string;
  categoriaId: string;
  celular?: string;
  teamId?: string | null;
  equipoTriple21Id?: string | null;
  agregadoPorAdminId: string;
}): Promise<AsesorAutorizado> {
  const categoria = await obtenerCategoriaAsesor(params.categoriaId);
  if (!categoria || !categoria.activo) {
    throw new Error("La categoria seleccionada no existe o esta inactiva.");
  }
  if (params.teamId) {
    const team = await obtenerAgrupacion(params.teamId);
    if (!team || !team.activo || team.tipo !== "TEAM") {
      throw new Error("El Team seleccionado no existe o está inactivo.");
    }
  }
  if (params.equipoTriple21Id) {
    const equipo = await obtenerAgrupacion(params.equipoTriple21Id);
    if (!equipo || !equipo.activo || equipo.tipo !== "EQUIPO_TRIPLE_21") {
      throw new Error(
        "El Equipo Triple 21 seleccionado no existe o está inactivo.",
      );
    }
  }

  const asesor: AsesorAutorizado = {
    telegramId: params.telegramId,
    nombre: params.nombre,
    categoriaId: params.categoriaId,
    activo: true,
    agregadoPorAdminId: params.agregadoPorAdminId,
    creadoEn: new Date().toISOString(),
    celular: params.celular?.trim() || undefined,
    teamId: params.teamId || undefined,
    equipoTriple21Id: params.equipoTriple21Id || undefined,
  };

  await kv.set(KEYS.asesor(asesor.telegramId), asesor);
  await kv.sadd(KEYS.asesoresIndex, asesor.telegramId);
  return asesor;
}

export async function actualizarPerfilAsesor(
  telegramId: string,
  cambios: {
    nombre?: string;
    celular?: string | null;
    avatarPathname?: string;
  },
): Promise<AsesorAutorizado> {
  const asesor = await obtenerAsesor(telegramId);
  if (!asesor) throw new Error("Asesor no encontrado.");

  const actualizado: AsesorAutorizado = {
    ...asesor,
    ...(cambios.nombre !== undefined ? { nombre: cambios.nombre.trim() } : {}),
    ...(cambios.celular !== undefined
      ? { celular: cambios.celular?.trim() || undefined }
      : {}),
    ...(cambios.avatarPathname !== undefined
      ? { avatarPathname: cambios.avatarPathname || undefined }
      : {}),
  };
  await kv.set(KEYS.asesor(telegramId), actualizado);
  return actualizado;
}

export async function cambiarEstadoAsesor(
  telegramId: string,
  activo: boolean,
): Promise<AsesorAutorizado> {
  const asesor = await obtenerAsesor(telegramId);
  if (!asesor) throw new Error("Asesor no encontrado.");
  const actualizado = { ...asesor, activo };
  await kv.set(KEYS.asesor(telegramId), actualizado);
  return actualizado;
}

export async function cambiarCategoriaAsesor(
  telegramId: string,
  categoriaId: string,
): Promise<AsesorAutorizado> {
  const asesor = await obtenerAsesor(telegramId);
  if (!asesor) throw new Error("Asesor no encontrado.");

  const categoria = await obtenerCategoriaAsesor(categoriaId);
  if (!categoria || !categoria.activo) {
    throw new Error("La categoria seleccionada no existe o esta inactiva.");
  }

  const actualizado: AsesorAutorizado = { ...asesor, categoriaId };
  await kv.set(KEYS.asesor(telegramId), actualizado);
  return actualizado;
}

export async function cambiarAgrupacionesAsesor(
  telegramId: string,
  cambios: { teamId?: string | null; equipoTriple21Id?: string | null },
): Promise<AsesorAutorizado> {
  const asesor = await obtenerAsesor(telegramId);
  if (!asesor) throw new Error("Asesor no encontrado.");

  if (cambios.teamId) {
    const team = await obtenerAgrupacion(cambios.teamId);
    if (!team || !team.activo || team.tipo !== "TEAM") {
      throw new Error("El Team seleccionado no existe o está inactivo.");
    }
  }
  if (cambios.equipoTriple21Id) {
    const equipo = await obtenerAgrupacion(cambios.equipoTriple21Id);
    if (!equipo || !equipo.activo || equipo.tipo !== "EQUIPO_TRIPLE_21") {
      throw new Error(
        "El Equipo Triple 21 seleccionado no existe o está inactivo.",
      );
    }
  }

  const actualizado: AsesorAutorizado = {
    ...asesor,
    ...(cambios.teamId !== undefined
      ? { teamId: cambios.teamId || undefined }
      : {}),
    ...(cambios.equipoTriple21Id !== undefined
      ? { equipoTriple21Id: cambios.equipoTriple21Id || undefined }
      : {}),
  };
  await kv.set(KEYS.asesor(telegramId), actualizado);
  return actualizado;
}

export async function listarAsesores(): Promise<AsesorAutorizado[]> {
  const ids = await kv.smembers(KEYS.asesoresIndex);
  if (!ids || ids.length === 0) return [];
  const asesores = await Promise.all(ids.map((id) => obtenerAsesor(id)));
  return asesores.filter((a): a is AsesorAutorizado => a !== null);
}

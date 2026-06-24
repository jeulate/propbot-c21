import { kv, KEYS } from "@/lib/redis";
import type { AsesorAutorizado } from "@/types/domain";
import { obtenerCategoriaAsesor } from "@/lib/repositories/categorias-asesor";

/**
 * Repositorio de la whitelist de asesores autorizados a usar el bot de Telegram.
 * Solo los administradores pueden agregar/desactivar asesores desde el dashboard.
 */

export async function obtenerAsesor(telegramId: string): Promise<AsesorAutorizado | null> {
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
  agregadoPorAdminId: string;
}): Promise<AsesorAutorizado> {
  const categoria = await obtenerCategoriaAsesor(params.categoriaId);
  if (!categoria || !categoria.activo) {
    throw new Error("La categoria seleccionada no existe o esta inactiva.");
  }

  const asesor: AsesorAutorizado = {
    telegramId: params.telegramId,
    nombre: params.nombre,
    categoriaId: params.categoriaId,
    activo: true,
    agregadoPorAdminId: params.agregadoPorAdminId,
    creadoEn: new Date().toISOString(),
  };

  await kv.set(KEYS.asesor(asesor.telegramId), asesor);
  await kv.sadd(KEYS.asesoresIndex, asesor.telegramId);
  return asesor;
}

export async function cambiarEstadoAsesor(
  telegramId: string,
  activo: boolean
): Promise<AsesorAutorizado> {
  const asesor = await obtenerAsesor(telegramId);
  if (!asesor) throw new Error("Asesor no encontrado.");
  const actualizado = { ...asesor, activo };
  await kv.set(KEYS.asesor(telegramId), actualizado);
  return actualizado;
}

export async function cambiarCategoriaAsesor(
  telegramId: string,
  categoriaId: string
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

export async function listarAsesores(): Promise<AsesorAutorizado[]> {
  const ids = await kv.smembers(KEYS.asesoresIndex);
  if (!ids || ids.length === 0) return [];
  const asesores = await Promise.all(ids.map((id) => obtenerAsesor(id)));
  return asesores.filter((a): a is AsesorAutorizado => a !== null);
}

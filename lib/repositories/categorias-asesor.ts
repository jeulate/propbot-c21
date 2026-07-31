import { randomUUID } from "node:crypto";
import { kv, KEYS } from "@/lib/redis";
import type {
  AsesorAutorizado,
  CategoriaAsesor,
  ConfiguracionComisiones,
} from "@/types/domain";

export async function obtenerCategoriaAsesor(
  id: string,
): Promise<CategoriaAsesor | null> {
  return (await kv.get<CategoriaAsesor>(KEYS.categoriaAsesor(id))) ?? null;
}

export async function listarCategoriasAsesor(): Promise<CategoriaAsesor[]> {
  const ids = await kv.smembers(KEYS.categoriasAsesorIndex);
  if (!ids || ids.length === 0) return [];

  const categorias = await Promise.all(ids.map(obtenerCategoriaAsesor));
  return categorias
    .filter((item): item is CategoriaAsesor => item !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

async function validarNombreUnico(nombre: string, excluirId?: string) {
  const normalizado = nombre.trim().toLocaleLowerCase("es");
  const categorias = await listarCategoriasAsesor();
  const repetida = categorias.some(
    (categoria) =>
      categoria.id !== excluirId &&
      categoria.nombre.trim().toLocaleLowerCase("es") === normalizado,
  );

  if (repetida) {
    throw new Error("Ya existe una categoría con ese nombre.");
  }
}

export async function crearCategoriaAsesor(params: {
  nombre: string;
  porcentajeComision: number;
}): Promise<CategoriaAsesor> {
  const nombre = params.nombre.trim();
  await validarNombreUnico(nombre);

  const categoria: CategoriaAsesor = {
    id: randomUUID(),
    nombre,
    porcentajeComision: params.porcentajeComision,
    activo: true,
    creadoEn: new Date().toISOString(),
  };

  await kv.set(KEYS.categoriaAsesor(categoria.id), categoria);
  await kv.sadd(KEYS.categoriasAsesorIndex, categoria.id);
  return categoria;
}

export async function actualizarCategoriaAsesor(
  id: string,
  cambios: {
    nombre?: string;
    porcentajeComision?: number;
  },
): Promise<CategoriaAsesor> {
  const categoria = await obtenerCategoriaAsesor(id);
  if (!categoria) throw new Error("Categoría no encontrada.");

  const nombre = cambios.nombre?.trim();
  if (nombre !== undefined) await validarNombreUnico(nombre, id);

  const actualizada: CategoriaAsesor = {
    ...categoria,
    ...(nombre !== undefined ? { nombre } : {}),
    ...(cambios.porcentajeComision !== undefined
      ? { porcentajeComision: cambios.porcentajeComision }
      : {}),
  };

  await kv.set(KEYS.categoriaAsesor(id), actualizada);
  return actualizada;
}

export async function cambiarEstadoCategoriaAsesor(
  id: string,
  activo: boolean,
): Promise<CategoriaAsesor> {
  const categoria = await obtenerCategoriaAsesor(id);
  if (!categoria) throw new Error("Categoría no encontrada.");

  const actualizada = { ...categoria, activo };
  await kv.set(KEYS.categoriaAsesor(id), actualizada);
  return actualizada;
}

export async function eliminarCategoriaAsesor(id: string): Promise<void> {
  const categoria = await obtenerCategoriaAsesor(id);
  if (!categoria) throw new Error("Categoría no encontrada.");

  const asesorIds = (await kv.smembers(KEYS.asesoresIndex)) ?? [];
  const asesores = await Promise.all(
    asesorIds.map((telegramId) =>
      kv.get<AsesorAutorizado>(KEYS.asesor(telegramId)),
    ),
  );

  if (asesores.some((asesor) => asesor?.categoriaId === id)) {
    throw new Error(
      "No puedes eliminar la categoría porque tiene asesores asignados. Reasígnalos o desactiva la categoría.",
    );
  }

  const configuracion = await kv.get<Partial<ConfiguracionComisiones>>(
    KEYS.configuracionComisiones,
  );

  if (configuracion?.comisionesTeamPorCategoria) {
    await kv.set(KEYS.configuracionComisiones, {
      ...configuracion,
      comisionesTeamPorCategoria:
        configuracion.comisionesTeamPorCategoria.filter(
          (item) => item.categoriaId !== id,
        ),
      actualizadoEn: new Date().toISOString(),
    });
  }

  await kv.del(KEYS.categoriaAsesor(id));
  await kv.srem(KEYS.categoriasAsesorIndex, id);
}

import { kv, KEYS } from "@/lib/redis";
import type { CategoriaAsesor } from "@/types/domain";

export async function obtenerCategoriaAsesor(id: string): Promise<CategoriaAsesor | null> {
  return (await kv.get<CategoriaAsesor>(KEYS.categoriaAsesor(id))) ?? null;
}

export async function listarCategoriasAsesor(): Promise<CategoriaAsesor[]> {
  const ids = await kv.smembers<string[]>(KEYS.categoriasAsesorIndex);
  if (!ids || ids.length === 0) return [];

  const categorias = await Promise.all(ids.map((id) => obtenerCategoriaAsesor(id)));
  return categorias
    .filter((categoria): categoria is CategoriaAsesor => categoria !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function crearCategoriaAsesor(params: {
  nombre: string;
  porcentajeComision: number;
}): Promise<CategoriaAsesor> {
  const nombreLimpio = params.nombre.trim();
  if (!nombreLimpio) {
    throw new Error("El nombre de la categoria es obligatorio.");
  }
  if (params.porcentajeComision <= 0 || params.porcentajeComision > 100) {
    throw new Error("El porcentaje de comision debe estar entre 0.01 y 100.");
  }

  const existentes = await listarCategoriasAsesor();
  const duplicada = existentes.find(
    (categoria) => categoria.nombre.toLowerCase() === nombreLimpio.toLowerCase()
  );
  if (duplicada) {
    throw new Error("Ya existe una categoria con ese nombre.");
  }

  const categoria: CategoriaAsesor = {
    id: crypto.randomUUID(),
    nombre: nombreLimpio,
    porcentajeComision: params.porcentajeComision,
    activo: true,
    creadoEn: new Date().toISOString(),
  };

  await kv.set(KEYS.categoriaAsesor(categoria.id), categoria);
  await kv.sadd(KEYS.categoriasAsesorIndex, categoria.id);
  return categoria;
}

export async function cambiarEstadoCategoriaAsesor(
  id: string,
  activo: boolean
): Promise<CategoriaAsesor> {
  const categoria = await obtenerCategoriaAsesor(id);
  if (!categoria) throw new Error("Categoria no encontrada.");

  const actualizada: CategoriaAsesor = { ...categoria, activo };
  await kv.set(KEYS.categoriaAsesor(id), actualizada);
  return actualizada;
}

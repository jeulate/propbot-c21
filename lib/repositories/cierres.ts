import { kv, KEYS } from "@/lib/redis";
import type { Cierre, CierreInput } from "@/types/domain";

/**
 * Repositorio de Cierres.
 * Patrón de almacenamiento:
 *  - Cada cierre se guarda como un hash/JSON en `cierre:<id>`.
 *  - `cierres:index` es un sorted set (score = epoch ms de creación) que permite
 *    paginar y ordenar cronológicamente sin tener que escanear todas las claves
 *    (evitar SCAN/KEYS en Redis en producción, que es costoso a escala).
 */

export async function crearCierre(
  input: CierreInput & { registradoPorTelegramId: string; registradoPorNombre: string }
): Promise<Cierre> {
  const yaExiste = await kv.get(KEYS.cierre(input.id));
  if (yaExiste) {
    throw new Error(`Ya existe un cierre registrado con el ID "${input.id}".`);
  }

  const ahora = new Date().toISOString();
  const cierre: Cierre = {
    ...input,
    creadoEn: ahora,
    actualizadoEn: ahora,
    estado: "PENDIENTE_REVISION",
  };

  await kv.set(KEYS.cierre(cierre.id), cierre);
  await kv.zadd(KEYS.cierresIndex, { score: Date.now(), member: cierre.id });

  return cierre;
}

export async function obtenerCierre(id: string): Promise<Cierre | null> {
  return (await kv.get<Cierre>(KEYS.cierre(id))) ?? null;
}

export async function actualizarEstadoCierre(
  id: string,
  estado: Cierre["estado"]
): Promise<Cierre> {
  const cierre = await obtenerCierre(id);
  if (!cierre) throw new Error("Cierre no encontrado.");

  const actualizado: Cierre = { ...cierre, estado, actualizadoEn: new Date().toISOString() };
  await kv.set(KEYS.cierre(id), actualizado);
  return actualizado;
}

export interface ListarCierresOpciones {
  desde?: number; // índice de paginación (0-based)
  cantidad?: number;
  orden?: "asc" | "desc";
}

export async function listarCierres(
  opciones: ListarCierresOpciones = {}
): Promise<{ cierres: Cierre[]; total: number }> {
  const { desde = 0, cantidad = 50, orden = "desc" } = opciones;

  const total = await kv.zcard(KEYS.cierresIndex);

  const ids =
    orden === "desc"
      ? await kv.zrange<string[]>(KEYS.cierresIndex, desde, desde + cantidad - 1, { rev: true })
      : await kv.zrange<string[]>(KEYS.cierresIndex, desde, desde + cantidad - 1);

  if (!ids || ids.length === 0) return { cierres: [], total };

  const cierres = await Promise.all(ids.map((id) => obtenerCierre(id)));
  return { cierres: cierres.filter((c): c is Cierre => c !== null), total };
}

/** Para exportación/dashboard: trae todos los cierres (uso interno, paginar en KV bajo el capó). */
export async function listarTodosLosCierres(): Promise<Cierre[]> {
  const total = await kv.zcard(KEYS.cierresIndex);
  if (total === 0) return [];
  const ids = await kv.zrange<string[]>(KEYS.cierresIndex, 0, total - 1, { rev: true });
  const cierres = await Promise.all(ids.map((id) => obtenerCierre(id)));
  return cierres.filter((c): c is Cierre => c !== null);
}

/** Métricas agregadas para el dashboard. */
export async function obtenerMetricas() {
  const cierres = await listarTodosLosCierres();

  const totalComisiones = cierres.reduce((acc, c) => acc + (c.montoComision || 0), 0);
  const totalTransacciones = cierres.reduce((acc, c) => acc + (c.montoTransaccion || 0), 0);

  const porTipo: Record<string, number> = {};
  const porAsesor: Record<string, { nombre: string; cierres: number; comision: number }> = {};
  const pendientes = cierres.filter((c) => c.estado === "PENDIENTE_REVISION").length;

  for (const c of cierres) {
    porTipo[c.tipoTransaccion] = (porTipo[c.tipoTransaccion] || 0) + 1;

    /*for (const [asesorId, asesorNombre] of [
      [c.asesorCaptadorId, c.asesorCaptadorNombre],
      [c.asesorColocadorId, c.asesorColocadorNombre],
    ]) {
      if (!porAsesor[asesorId]) {
        porAsesor[asesorId] = { nombre: asesorNombre, cierres: 0, comision: 0 };
      }
      porAsesor[asesorId].cierres += 1;
      porAsesor[asesorId].comision += c.montoComision / 2; // comisión repartida captador/colocador
    }*/
    const asesorId = c.registradoPorTelegramId;
    const asesorNombre = c.registradoPorNombre;

    if (!porAsesor[asesorId]) {
      porAsesor[asesorId] = {
        nombre: asesorNombre,
        cierres: 0,
        comision: 0,
      };
    }

    porAsesor[asesorId].cierres += 1;
    porAsesor[asesorId].comision += c.montoComision || 0;
  }

  return {
    totalCierres: cierres.length,
    totalComisiones,
    totalTransacciones,
    pendientesRevision: pendientes,
    porTipo,
    porAsesor: Object.entries(porAsesor)
      .map(([id, datos]) => ({ id, ...datos }))
      .sort((a, b) => b.cierres - a.cierres),
    ultimosCierres: cierres.slice(0, 8),
  };
}

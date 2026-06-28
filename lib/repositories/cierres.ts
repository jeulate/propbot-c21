import { kv, KEYS } from "@/lib/redis";
import type { Cierre, CierreInput } from "@/types/domain";
import { obtenerAsesor } from "@/lib/repositories/asesores";
import { obtenerCategoriaAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";
import { calcularComisionCierre } from "@/lib/comisiones";

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

  const asesor = await obtenerAsesor(input.registradoPorTelegramId);
  if (!asesor || !asesor.activo) {
    throw new Error("El asesor que registra el cierre no esta autorizado o esta inactivo.");
  }

  const categoria = await obtenerCategoriaAsesor(asesor.categoriaId);
  if (!categoria || !categoria.activo) {
    throw new Error("El asesor no tiene una categoria activa para calcular su comision.");
  }

  const configuracion = await obtenerConfiguracionComisiones();
  const esCaptadorYColocadorMismoAsesor =
    input.asesorCaptadorId === input.asesorColocadorId;

  const comision = calcularComisionCierre({
    montoTransaccion: input.montoTransaccion,
    tipoTransaccion: input.tipoTransaccion,
    esCaptadorYColocadorMismoAsesor,
    porcentajeOficinaNacional: configuracion.porcentajeOficinaNacional,
    porcentajeCategoriaAsesor: categoria.porcentajeComision,
  });

  const ahora = new Date().toISOString();
  const cierre: Cierre = {
    ...input,
    montoComision: comision.montoComisionTotal,
    porcentajeOficinaNacionalAplicado: comision.porcentajeOficinaNacionalAplicado,
    porcentajeOficinaLocalAplicado: comision.porcentajeOficinaLocalAplicado,
    montoPagoOficinaNacional: comision.montoPagoOficinaNacional,
    montoPagoOficinaLocal: comision.montoPagoOficinaLocal,
    porcentajeCategoriaAplicado: comision.porcentajeCategoriaAplicado,
    montoPagoRealAsesor: comision.montoPagoRealAsesor,
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

  const totalCierres = cierres.length;
  const totalComisiones = cierres.reduce((acc, c) => acc + (c.montoComision || 0), 0);
  const totalPagosReales = cierres.reduce((acc, c) => acc + (c.montoPagoRealAsesor || 0), 0);
  const totalTransacciones = cierres.reduce((acc, c) => acc + (c.montoTransaccion || 0), 0);
  const ticketPromedio = totalCierres > 0 ? totalTransacciones / totalCierres : 0;
  const comisionPromedio = totalCierres > 0 ? totalComisiones / totalCierres : 0;

  const porTipo: Record<string, number> = {};
  const porAsesor: Record<string, { nombre: string; cierres: number; comision: number }> = {};
  const porCaptador: Record<string, { nombre: string; cierres: number }> = {};
  const porColocador: Record<string, { nombre: string; cierres: number }> = {};

  const pendientes = cierres.filter((c) => c.estado === "PENDIENTE_REVISION").length;

  function sumarRanking(
    ranking: Record<string, { nombre: string; cierres: number }>,
    id: string,
    nombre: string
  ) {
    if (!ranking[id]) {
      ranking[id] = { nombre, cierres: 0 };
    }
    ranking[id].cierres += 1;
  }

  async function obtenerAsesorRegistradoActivo(id: string) {
    if (!id || id.startsWith("externo:")) return null;

    const asesor = await obtenerAsesor(id);
    return asesor && asesor.activo ? asesor : null;
  }

  for (const c of cierres) {
    porTipo[c.tipoTransaccion] = (porTipo[c.tipoTransaccion] || 0) + 1;

    const registradorId = c.registradoPorTelegramId;
    const registradorNombre = c.registradoPorNombre;

    if (!porAsesor[registradorId]) {
      porAsesor[registradorId] = {
        nombre: registradorNombre,
        cierres: 0,
        comision: 0,
      };
    }

    porAsesor[registradorId].cierres += 1;
    porAsesor[registradorId].comision += c.montoPagoRealAsesor || 0;

    const captadorRegistrado = await obtenerAsesorRegistradoActivo(c.asesorCaptadorId);
    if (captadorRegistrado) {
      sumarRanking(porCaptador, captadorRegistrado.telegramId, captadorRegistrado.nombre);
    }

    const colocadorRegistrado = await obtenerAsesorRegistradoActivo(c.asesorColocadorId);
    if (colocadorRegistrado) {
      sumarRanking(porColocador, colocadorRegistrado.telegramId, colocadorRegistrado.nombre);
    }
  }

  const rankingAsesores = Object.entries(porAsesor)
    .map(([id, datos]) => ({ id, ...datos }))
    .sort((a, b) => b.cierres - a.cierres);

  const rankingProducer = Object.entries(porAsesor)
    .map(([id, datos]) => ({ id, nombre: datos.nombre, valor: datos.comision }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const rankingCaptadores = Object.entries(porCaptador)
    .map(([id, datos]) => ({ id, ...datos }))
    .sort((a, b) => b.cierres - a.cierres)
    .slice(0, 10);

  const rankingColocadores = Object.entries(porColocador)
    .map(([id, datos]) => ({ id, ...datos }))
    .sort((a, b) => b.cierres - a.cierres)
    .slice(0, 10);

  return {
    totalCierres,
    totalComisiones,
    totalPagosReales,
    totalTransacciones,
    ticketPromedio,
    comisionPromedio,
    pendientesRevision: pendientes,
    porTipo,

    // Mantiene compatibilidad con tu gráfico actual.
    porAsesor: rankingAsesores,

    // Nuevos KPIs/rankings.
    topColocacion: rankingAsesores.slice(0, 10),
    topProducer: rankingProducer,
    topCaptadores: rankingCaptadores,
    topColocadores: rankingColocadores,

    ultimosCierres: cierres.slice(0, 8),
  };
}

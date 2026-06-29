import type { MetaMensual, MetaMensualInput } from "@/types/domain";
import { kv, KEYS } from "@/lib/redis";

const METAS_KEY = KEYS.metasMensuales;

function crearIdMeta(anio: number, mes: number): string {
  return `meta:${anio}:${String(mes).padStart(2, "0")}`;
}

function validarMeta(input: MetaMensualInput) {
  if (!Number.isInteger(input.anio) || input.anio < 2020 || input.anio > 2100) {
    throw new Error("El año de la meta mensual no es válido.");
  }

  if (!Number.isInteger(input.mes) || input.mes < 1 || input.mes > 12) {
    throw new Error("El mes de la meta mensual no es válido.");
  }

  if (!Number.isFinite(input.montoObjetivo) || input.montoObjetivo < 0) {
    throw new Error("El monto objetivo debe ser mayor o igual a 0.");
  }
}

export async function listarMetasMensuales(): Promise<MetaMensual[]> {
  const metas = (await kv.get<MetaMensual[]>(METAS_KEY)) ?? [];

  return metas.sort((a, b) => {
    if (a.anio !== b.anio) return b.anio - a.anio;
    return b.mes - a.mes;
  });
}

export async function obtenerMetaMensual(
  anio: number,
  mes: number
): Promise<MetaMensual | null> {
  const metas = await listarMetasMensuales();
  const id = crearIdMeta(anio, mes);

  return metas.find((meta) => meta.id === id) ?? null;
}

export async function guardarMetaMensual(
  input: MetaMensualInput
): Promise<MetaMensual> {
  validarMeta(input);

  const metas = await listarMetasMensuales();
  const id = crearIdMeta(input.anio, input.mes);
  const ahora = new Date().toISOString();

  const existente = metas.find((meta) => meta.id === id);

  const meta: MetaMensual = {
    id,
    anio: input.anio,
    mes: input.mes,
    montoObjetivo: input.montoObjetivo,
    creadoEn: existente?.creadoEn ?? ahora,
    actualizadoEn: ahora,
  };

  const nuevasMetas = [meta, ...metas.filter((item) => item.id !== id)].sort((a, b) => {
    if (a.anio !== b.anio) return b.anio - a.anio;
    return b.mes - a.mes;
  });

  await kv.set(METAS_KEY, nuevasMetas);

  return meta;
}
import { kv, KEYS } from "@/lib/redis";
import type { CaptacionMensual, CaptacionMensualInput } from "@/types/domain";

const CAPTACIONES_KEY = KEYS.captacionesMensuales;

function crearIdCaptacion(anio: number, mes: number, asesorTelegramId: string): string {
  return `captacion:${anio}:${String(mes).padStart(2, "0")}:${asesorTelegramId}`;
}

function validarInput(input: CaptacionMensualInput) {
  if (!Number.isInteger(input.anio) || input.anio < 2020 || input.anio > 2100) {
    throw new Error("El año no es válido.");
  }

  if (!Number.isInteger(input.mes) || input.mes < 1 || input.mes > 12) {
    throw new Error("El mes no es válido.");
  }

  if (!input.asesorTelegramId || !input.asesorNombre) {
    throw new Error("El asesor es obligatorio.");
  }

  if (!Number.isInteger(input.cantidad) || input.cantidad < 0) {
    throw new Error("La cantidad de captaciones debe ser un número entero mayor o igual a 0.");
  }
}

export async function listarCaptacionesMensuales(): Promise<CaptacionMensual[]> {
  const captaciones = (await kv.get<CaptacionMensual[]>(CAPTACIONES_KEY)) ?? [];

  return captaciones.sort((a, b) => {
    if (a.anio !== b.anio) return b.anio - a.anio;
    if (a.mes !== b.mes) return b.mes - a.mes;
    return b.cantidad - a.cantidad;
  });
}

export async function listarCaptacionesPorPeriodo(
  anio: number,
  mes: number
): Promise<CaptacionMensual[]> {
  const captaciones = await listarCaptacionesMensuales();

  return captaciones
    .filter((item) => item.anio === anio && item.mes === mes)
    .sort((a, b) => b.cantidad - a.cantidad);
}

export async function guardarCaptacionMensual(
  input: CaptacionMensualInput
): Promise<CaptacionMensual> {
  validarInput(input);

  const captaciones = await listarCaptacionesMensuales();
  const id = crearIdCaptacion(input.anio, input.mes, input.asesorTelegramId);
  const ahora = new Date().toISOString();

  const existente = captaciones.find((item) => item.id === id);

  const captacion: CaptacionMensual = {
    id,
    anio: input.anio,
    mes: input.mes,
    asesorTelegramId: input.asesorTelegramId,
    asesorNombre: input.asesorNombre,
    cantidad: input.cantidad,
    creadoEn: existente?.creadoEn ?? ahora,
    actualizadoEn: ahora,
  };

  const nuevasCaptaciones = [
    captacion,
    ...captaciones.filter((item) => item.id !== id),
  ];

  await kv.set(CAPTACIONES_KEY, nuevasCaptaciones);

  return captacion;
}
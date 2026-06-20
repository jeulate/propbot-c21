import { z } from "zod";

/**
 * Cada validador devuelve { ok: true, value } o { ok: false, error } con un
 * mensaje en español listo para mostrarle al asesor en el chat de Telegram.
 */

type Resultado<T> = { ok: true; value: T } | { ok: false; error: string };

export function validarId(texto: string): Resultado<string> {
  const limpio = texto.trim();
  if (limpio.length < 1 || limpio.length > 40) {
    return { ok: false, error: "El ID debe tener entre 1 y 40 caracteres. Intenta de nuevo." };
  }
  return { ok: true, value: limpio };
}

export function validarFecha(texto: string): Resultado<string> {
  const match = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return { ok: false, error: "Formato inválido. Usa DD/MM/AAAA, por ejemplo: 19/06/2026" };
  }
  const [, dia, mes, anio] = match;
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  if (fecha.getMonth() !== Number(mes) - 1 || fecha.getDate() !== Number(dia)) {
    return { ok: false, error: "Esa fecha no existe. Verifica el día y mes e intenta de nuevo." };
  }
  const iso = `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  return { ok: true, value: iso };
}

export function validarTexto(texto: string, campo: string, min = 2, max = 150): Resultado<string> {
  const limpio = texto.trim();
  if (limpio.length < min) {
    return { ok: false, error: `${campo} es muy corto. Ingresa al menos ${min} caracteres.` };
  }
  if (limpio.length > max) {
    return { ok: false, error: `${campo} es muy largo (máx. ${max} caracteres).` };
  }
  return { ok: true, value: limpio };
}

const TIPOS_TRANSACCION = ["VENTA", "ALQUILER", "ANTICRÉTICO"] as const;

export function validarTipoTransaccion(texto: string): Resultado<(typeof TIPOS_TRANSACCION)[number]> {
  const normalizado = texto.trim().toUpperCase().replace("ANTICRETICO", "ANTICRÉTICO");
  if (!TIPOS_TRANSACCION.includes(normalizado as any)) {
    return { ok: false, error: "Selecciona una opción válida usando los botones." };
  }
  return { ok: true, value: normalizado as (typeof TIPOS_TRANSACCION)[number] };
}

export function validarMonto(texto: string, campo: string): Resultado<number> {
  const limpio = texto.trim().replace(/[,$\s]/g, "");
  const numero = Number(limpio);
  if (Number.isNaN(numero) || numero < 0) {
    return { ok: false, error: `${campo} debe ser un número válido y positivo. Ejemplo: 85000` };
  }
  if (numero > 100_000_000) {
    return { ok: false, error: `${campo} parece demasiado alto. Verifica el monto.` };
  }
  return { ok: true, value: Math.round(numero * 100) / 100 };
}

export function validarTipoCambio(texto: string): Resultado<number> {
  const limpio = texto.trim().replace(",", ".");
  const numero = Number(limpio);
  if (Number.isNaN(numero) || numero <= 0 || numero > 50) {
    return { ok: false, error: "El tipo de cambio debe ser un número válido, ej: 6.96" };
  }
  return { ok: true, value: numero };
}

const regexTelefono = /^[\d+\-\s()]{6,20}$/;

export function validarTelefono(texto: string): Resultado<string> {
  const limpio = texto.trim();
  if (!regexTelefono.test(limpio)) {
    return { ok: false, error: "Ingresa un teléfono válido, ej: 70123456 o +591 70123456" };
  }
  return { ok: true, value: limpio };
}

export function validarBooleanoSiNo(texto: string): Resultado<boolean> {
  const normalizado = texto.trim().toUpperCase();
  if (["SI", "SÍ", "YES"].includes(normalizado)) return { ok: true, value: true };
  if (["NO"].includes(normalizado)) return { ok: true, value: false };
  return { ok: false, error: "Responde usando los botones SI / NO." };
}

export const esquemaCierreCompleto = z.object({
  id: z.string().min(1).max(40),
  fechaCierre: z.string(),
  asesorCaptadorNombre: z.string().min(2),
  asesorColocadorNombre: z.string().min(2),
  direccionInmueble: z.string().min(2),
  tipoTransaccion: z.enum(TIPOS_TRANSACCION),
  montoTransaccion: z.number().positive(),
  montoComision: z.number().nonnegative(),
  tipoCambio: z.number().positive(),
  nombrePropietario: z.string().min(2),
  telPropietario: z.string(),
  nombreCliente: z.string().min(2),
  telCliente: z.string(),
  exclusiva: z.boolean(),
});

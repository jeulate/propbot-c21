/**
 * Máquina de estados para el flujo conversacional de registro de cierres.
 *
 * El bot le hace al asesor una pregunta por campo, en el mismo orden que las
 * columnas del Excel "CONTROL DE CIERRES", y guarda las respuestas parciales
 * en Redis (clave bot:estado:<telegramId>) mientras dura la conversación.
 * Esto permite que el asesor pueda cerrar Telegram y continuar después sin
 * perder lo que ya llenó.
 */
import { kv, KEYS } from "@/lib/redis";
import type { TipoTransaccion } from "@/types/domain";

export type PasoFormulario =
  | "ID"
  | "FECHA_CIERRE"
  | "ASESOR_CAPTADOR"
  | "ASESOR_COLOCADOR"
  | "DIRECCION_INMUEBLE"
  | "TIPO_TRANSACCION"
  | "MONTO_TRANSACCION"
  | "MONTO_COMISION"
  | "TIPO_CAMBIO"
  | "NOMBRE_PROPIETARIO"
  | "TEL_PROPIETARIO"
  | "NOMBRE_CLIENTE"
  | "TEL_CLIENTE"
  | "EXCLUSIVA"
  | "CONFIRMACION";

export const ORDEN_PASOS: PasoFormulario[] = [
  "ID",
  "FECHA_CIERRE",
  "ASESOR_CAPTADOR",
  "ASESOR_COLOCADOR",
  "DIRECCION_INMUEBLE",
  "TIPO_TRANSACCION",
  "MONTO_TRANSACCION",
  "MONTO_COMISION",
  "TIPO_CAMBIO",
  "NOMBRE_PROPIETARIO",
  "TEL_PROPIETARIO",
  "NOMBRE_CLIENTE",
  "TEL_CLIENTE",
  "EXCLUSIVA",
  "CONFIRMACION",
];

export interface DatosParciales {
  id?: string;
  fechaCierre?: string;
  asesorCaptadorNombre?: string;
  asesorColocadorNombre?: string;
  direccionInmueble?: string;
  tipoTransaccion?: TipoTransaccion;
  montoTransaccion?: number;
  montoComision?: number;
  tipoCambio?: number;
  nombrePropietario?: string;
  telPropietario?: string;
  nombreCliente?: string;
  telCliente?: string;
  exclusiva?: boolean;
}

export interface EstadoConversacion {
  paso: PasoFormulario;
  datos: DatosParciales;
  iniciadoEn: string;
}

const TTL_ESTADO_SEGUNDOS = 60 * 60 * 6; // 6 horas — evita estados "fantasma" abandonados

export async function obtenerEstado(telegramId: string): Promise<EstadoConversacion | null> {
  return (await kv.get<EstadoConversacion>(KEYS.botEstado(telegramId))) ?? null;
}

export async function guardarEstado(telegramId: string, estado: EstadoConversacion): Promise<void> {
  await kv.set(KEYS.botEstado(telegramId), estado, { ex: TTL_ESTADO_SEGUNDOS });
}

export async function limpiarEstado(telegramId: string): Promise<void> {
  await kv.del(KEYS.botEstado(telegramId));
}

export function iniciarNuevoEstado(): EstadoConversacion {
  return { paso: "ID", datos: {}, iniciadoEn: new Date().toISOString() };
}

export function siguientePaso(actual: PasoFormulario): PasoFormulario {
  const idx = ORDEN_PASOS.indexOf(actual);
  return ORDEN_PASOS[Math.min(idx + 1, ORDEN_PASOS.length - 1)];
}

/** Textos de las preguntas, en el mismo orden que las columnas del Excel original. */
export const PREGUNTAS: Record<PasoFormulario, string> = {
  ID: "📋 Vamos a registrar un nuevo cierre.\n\n¿Cuál es el *ID / N° de expediente* de este cierre?",
  FECHA_CIERRE: "📅 ¿Cuál es la *fecha de cierre*? (formato DD/MM/AAAA)",
  ASESOR_CAPTADOR: "🧑‍💼 ¿Nombre del *asesor captador* (quien capto la propiedad)?",
  ASESOR_COLOCADOR: "🤝 ¿Nombre del *asesor colocador* (quien cerró con el cliente)?",
  DIRECCION_INMUEBLE: "📍 ¿Cuál es la *dirección del inmueble*?",
  TIPO_TRANSACCION: "🏷️ ¿Qué *tipo de transacción* es?",
  MONTO_TRANSACCION: "💰 ¿Cuál es el *monto de la transacción*? (solo el número, en USD)",
  MONTO_COMISION: "💵 ¿Cuál es el *monto de la comisión*? (solo el número, en USD)",
  TIPO_CAMBIO: "💱 ¿Cuál es el *tipo de cambio (T.C.)* usado?",
  NOMBRE_PROPIETARIO: "👤 ¿*Nombre del propietario*?",
  TEL_PROPIETARIO: "📞 ¿*Teléfono del propietario*?",
  NOMBRE_CLIENTE: "👤 ¿*Nombre del cliente* (comprador/inquilino)?",
  TEL_CLIENTE: "📞 ¿*Teléfono del cliente*?",
  EXCLUSIVA: "🔒 ¿Esta operación fue en *exclusiva*?",
  CONFIRMACION: "✅ Revisa el resumen del cierre antes de guardar:",
};

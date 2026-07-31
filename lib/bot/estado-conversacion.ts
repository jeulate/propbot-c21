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
  | "CAPTADOR_ES_REGISTRANTE"
  | "CAPTADOR_INTERNO_O_EXTERNO"
  | "COLOCADOR_INTERNO_O_EXTERNO"
  | "ASESOR_CAPTADOR_NOMBRE"
  | "ASESOR_CAPTADOR_OFICINA"
  | "ASESOR_CAPTADOR_TELEFONO"
  | "COLOCADOR_ES_REGISTRANTE"
  | "ASESOR_COLOCADOR_NOMBRE"
  | "ASESOR_COLOCADOR_OFICINA"
  | "ASESOR_COLOCADOR_TELEFONO"
  | "DIRECCION_INMUEBLE"
  | "TIPO_TRANSACCION"
  | "MONTO_TRANSACCION"
  | "CONFIRMAR_COMISION"
  | "TIPO_CAMBIO"
  | "NOMBRE_PROPIETARIO"
  | "TEL_PROPIETARIO"
  | "NOMBRE_CLIENTE"
  | "TEL_CLIENTE"
  | "EXCLUSIVA"
  | "COMPROBANTE_PAGO"
  | "COMPROBANTE_OFICINA"
  | "COMPROBANTE_TEAM_LEADER"
  | "CONFIRMACION";

export const ORDEN_PASOS: PasoFormulario[] = [
  "ID",
  "FECHA_CIERRE",
  "CAPTADOR_ES_REGISTRANTE",
  "CAPTADOR_INTERNO_O_EXTERNO",
  "ASESOR_CAPTADOR_NOMBRE",
  "ASESOR_CAPTADOR_OFICINA",
  "ASESOR_CAPTADOR_TELEFONO",
  "COLOCADOR_ES_REGISTRANTE",
  "COLOCADOR_INTERNO_O_EXTERNO",
  "ASESOR_COLOCADOR_NOMBRE",
  "ASESOR_COLOCADOR_OFICINA",
  "ASESOR_COLOCADOR_TELEFONO",
  "DIRECCION_INMUEBLE",
  "TIPO_TRANSACCION",
  "MONTO_TRANSACCION",
  "CONFIRMAR_COMISION",
  "TIPO_CAMBIO",
  "NOMBRE_PROPIETARIO",
  "TEL_PROPIETARIO",
  "NOMBRE_CLIENTE",
  "TEL_CLIENTE",
  "EXCLUSIVA",
  "COMPROBANTE_PAGO",
  "COMPROBANTE_OFICINA",
  "COMPROBANTE_TEAM_LEADER",
  "CONFIRMACION",
];

export interface DatosParciales {
  idInmueble?: string;
  rolRegistro?: "CAPTADOR" | "COLOCADOR" | "AMBOS";
  urlPropiedad?: string;
  tituloPropiedad?: string;
  fechaCierre?: string;
  asesorRegistranteNombre?: string;
  captadorEsRegistrante?: boolean;
  asesorCaptadorId?: string;
  asesorCaptadorNombre?: string;
  asesorCaptadorOficina?: string;
  asesorCaptadorTelefono?: string;
  colocadorEsRegistrante?: boolean;
  asesorColocadorId?: string;
  asesorColocadorNombre?: string;
  asesorColocadorOficina?: string;
  asesorColocadorTelefono?: string;
  direccionInmueble?: string;
  tipoTransaccion?: TipoTransaccion;
  montoTransaccion?: number;
  montoComision?: number;
  porcentajeBaseComision?: number;
  porcentajeOficinaNacionalAplicado?: number;
  porcentajeOficinaLocalAplicado?: number;
  porcentajeCategoriaAplicado?: number;
  montoPagoOficinaNacional?: number;
  montoPagoOficinaLocal?: number;
  montoPagoRealAsesor?: number;
  tipoCalculoComision?: "INDIVIDUAL" | "TEAM";
  teamNombreAplicado?: string;
  teamLeaderNombreAplicado?: string;
  porcentajeOficinaTeamAplicado?: number;
  porcentajeTeamLeaderAplicado?: number;
  montoPagoTeamLeader?: number;
  tipoCambio?: number;
  nombrePropietario?: string;
  telPropietario?: string;
  nombreCliente?: string;
  telCliente?: string;
  exclusiva?: boolean;
  comprobantePagoFileId?: string;
  comprobantePagoFileUniqueId?: string;
  comprobantePagoTipo?: "photo" | "document";
  comprobantePagoNombreArchivo?: string;
  comprobantePagoMimeType?: string;
  comprobanteOficinaFileId?: string;
  comprobanteOficinaFileUniqueId?: string;
  comprobanteOficinaTipo?: "photo" | "document";
  comprobanteTeamLeaderFileId?: string;
  comprobanteTeamLeaderFileUniqueId?: string;
  comprobanteTeamLeaderTipo?: "photo" | "document";
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
  ID: "📋 Vamos a registrar un nuevo cierre.\n\n¿Cuál es el *ID / N° de inmueble* de este cierre?",
  FECHA_CIERRE: "📅 ¿Cuál es la *fecha de cierre*? (formato DD/MM/AAAA)",
  CAPTADOR_ES_REGISTRANTE:
    "🧑‍💼 En este cierre, ¿el *asesor captador* eres tú (quien está registrando la operación)?",
  CAPTADOR_INTERNO_O_EXTERNO: "🧑‍💼 ¿El asesor captador pertenece a esta oficina?",  
  ASESOR_CAPTADOR_NOMBRE: "🧑‍💼 Escribe el *nombre del asesor captador*.",
  ASESOR_CAPTADOR_OFICINA: "🏢 Escribe la *oficina a la que pertenece el asesor captador*.",
  ASESOR_CAPTADOR_TELEFONO: "📞 Escribe el *teléfono del asesor captador*.",
  COLOCADOR_ES_REGISTRANTE:
    "🤝 En este cierre, ¿el *asesor colocador* eres tú (quien está registrando la operación)?",
  COLOCADOR_INTERNO_O_EXTERNO: "🤝 ¿El asesor colocador pertenece a esta oficina?",  
  ASESOR_COLOCADOR_NOMBRE: "🤝 Escribe el *nombre del asesor colocador*.",
  ASESOR_COLOCADOR_OFICINA: "🏢 Escribe la *oficina a la que pertenece el asesor colocador*.",
  ASESOR_COLOCADOR_TELEFONO: "📞 Escribe el *teléfono del asesor colocador*.",
  DIRECCION_INMUEBLE: "📍 ¿Cuál es la *dirección del inmueble*?",
  TIPO_TRANSACCION: "🏷️ ¿Qué *tipo de transacción* es?",
  MONTO_TRANSACCION: "💰 ¿Cuál es el *monto de la transacción*? (solo número, en Bs)",
  CONFIRMAR_COMISION:
    "📋 Te mostraré la comisión calculada automáticamente. Confirma si el monto es correcto para continuar.",
  TIPO_CAMBIO: "💱 ¿Cuál es el *tipo de cambio (T.C.)* usado?",
  NOMBRE_PROPIETARIO: "👤 ¿*Nombre del propietario*?",
  TEL_PROPIETARIO: "📞 ¿*Teléfono del propietario*?",
  NOMBRE_CLIENTE: "👤 ¿*Nombre del cliente* (comprador/inquilino)?",
  TEL_CLIENTE: "📞 ¿*Teléfono del cliente*?",
  EXCLUSIVA: "🔒 ¿Esta operación fue en *exclusiva*?",
  COMPROBANTE_PAGO: "📸 Adjunta una *imagen del comprobante de pago de la comisión*.\n\nDebe verse claramente el monto pagado.",
  COMPROBANTE_OFICINA: "📸 Adjunta el comprobante de pago a la oficina.",
  COMPROBANTE_TEAM_LEADER: "📸 Adjunta el comprobante de pago al Team Leader.",
  CONFIRMACION: "✅ Revisa el resumen del cierre antes de guardar:",
};

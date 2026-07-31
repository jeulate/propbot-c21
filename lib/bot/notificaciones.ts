import type { Cierre } from "@/types/domain";

interface EnviarMensajeOpciones {
  chatId: string;
  texto: string;
}

function formatoBs(valor?: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 2,
  }).format(valor ?? 0)}`;
}

async function enviarMensajeTelegram({
  chatId,
  texto,
}: EnviarMensajeOpciones): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn("No se envió notificación de Telegram: falta TELEGRAM_BOT_TOKEN.");
    return false;
  }

  const respuesta = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: "Markdown",
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    console.error("Telegram devolvió error al enviar notificación:", detalle);
    return false;
  }

  return true;
}

export async function notificarCierreVerificado(cierre: Cierre): Promise<void> {
  const mensaje = [
    "✅ *Tu cierre fue verificado por administración.*",
    "",
    `🆔 ID inmueble: ${cierre.idInmueble ?? cierre.id}`,
    `🏷️ Tipo: ${cierre.tipoTransaccion}`,
    `💰 Comisión registrada: ${formatoBs(cierre.montoComision)}`,
    "",
    cierre.tipoCalculoComision === "TEAM"
      ? "Los comprobantes de oficina y Team Leader fueron validados. El proceso quedó aprobado."
      : "El comprobante fue validado y el registro quedó aprobado.",
  ].join("\n");

  const enviado = await enviarMensajeTelegram({
    chatId: cierre.registradoPorTelegramId,
    texto: mensaje,
  });

  if (!enviado) {
    console.warn(`No fue posible notificar al asesor del cierre ${cierre.id}.`);
  }
}

export async function notificarCierreRechazado(cierre: Cierre): Promise<void> {
  const mensaje = [
    "❌ *Tu cierre fue rechazado por administración.*",
    "",
    `📋 ID inmueble: ${cierre.idInmueble ?? cierre.id}`,
    `🏷️ Tipo: ${cierre.tipoTransaccion}`,
    `💰 Comisión registrada: ${formatoBs(cierre.montoComision)}`,
    "",
    `Motivo: ${cierre.motivoRechazo ?? "No especificado."}`,
    "",
    cierre.tipoCalculoComision === "TEAM"
      ? "Revisa los comprobantes de oficina y Team Leader antes de volver a registrar el cierre."
      : "Revisa la información antes de volver a registrar el cierre.",
  ].join("\n");

  const enviado = await enviarMensajeTelegram({
    chatId: cierre.registradoPorTelegramId,
    texto: mensaje,
  });
  if (!enviado) {
    console.warn(`No fue posible notificar al asesor del cierre rechazado ${cierre.id}.`);
  }
}
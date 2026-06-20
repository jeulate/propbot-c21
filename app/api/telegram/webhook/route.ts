import { webhookCallback } from "grammy";
import { NextRequest } from "next/server";

/**
 * Webhook que Telegram llama cada vez que hay un mensaje/evento nuevo.
 * Configurar con: npm run bot:webhook:set
 * URL resultante: https://<tu-dominio>.vercel.app/api/telegram/webhook
 */

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { bot } = await import("@/lib/bot/bot");
  const handleUpdate = webhookCallback(bot, "std/http");

  // Verificación opcional con secret token (recomendado en producción)
  const secretEsperado = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretEsperado) {
    const secretRecibido = req.headers.get("x-telegram-bot-api-secret-token");
    if (secretRecibido !== secretEsperado) {
      return new Response("No autorizado", { status: 401 });
    }
  }

  try {
    return await handleUpdate(req);
  } catch (error) {
    console.error("Error procesando webhook de Telegram:", error);
    return new Response("OK", { status: 200 }); // Telegram reintenta si no devolvemos 200
  }
}

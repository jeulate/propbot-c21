import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot/bot";
import { NextRequest } from "next/server";

/**
 * Webhook que Telegram llama cada vez que hay un mensaje/evento nuevo.
 * Configurar con: npm run bot:webhook:set
 * URL resultante: https://<tu-dominio>.vercel.app/api/telegram/webhook
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const handleUpdate = webhookCallback(bot, "std/http");

export async function POST(req: NextRequest) {
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

/**
 * Configura el webhook de Telegram para que apunte a tu deploy de Vercel.
 * Uso: npm run bot:webhook:set
 * Requiere las variables TELEGRAM_BOT_TOKEN y APP_URL en .env.local
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.APP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token) throw new Error("Falta TELEGRAM_BOT_TOKEN en .env.local");
  if (!appUrl) throw new Error("Falta APP_URL en .env.local (ej: https://propbot-c21.vercel.app)");

  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  const params = new URLSearchParams({ url: webhookUrl });
  if (secret) params.set("secret_token", secret);

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?${params}`);
  const data = await res.json();

  if (!data.ok) {
    console.error("❌ Error configurando webhook:", data);
    process.exit(1);
  }

  console.log("✅ Webhook configurado correctamente en:", webhookUrl);
  console.log(data);
}

main();

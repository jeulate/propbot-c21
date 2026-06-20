import "dotenv/config";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Falta TELEGRAM_BOT_TOKEN en .env.local");

  const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
  const data = await res.json();
  console.log(data.ok ? "✅ Webhook eliminado." : "❌ Error:", data);
}

main();

/**
 * Modo de desarrollo local: usa long-polling en vez de webhook, así no
 * necesitas exponer tu máquina a internet (ngrok, etc.) mientras desarrollas
 * el flujo conversacional del bot.
 *
 * IMPORTANTE: antes de correr esto, ejecuta `npm run bot:webhook:delete`
 * si ya configuraste un webhook, porque Telegram no permite polling y
 * webhook activos al mismo tiempo sobre el mismo bot.
 *
 * Uso: npm run bot:dev
 */
import "dotenv/config";
import { bot } from "@/lib/bot/bot";

console.log("🤖 Bot corriendo en modo polling (desarrollo local)...");
bot.start({
  onStart: (info) => console.log(`✅ Conectado como @${info.username}`),
});

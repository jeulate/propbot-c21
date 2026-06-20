/**
 * Cliente único de Redis (Vercel KV) para todo el proyecto.
 * Usa @vercel/kv, que en producción se conecta automáticamente con las
 * variables de entorno KV_REST_API_URL y KV_REST_API_TOKEN inyectadas por
 * Vercel al vincular un KV Store (Redis) al proyecto.
 *
 * En desarrollo local, define esas mismas variables en .env.local apuntando
 * a tu instancia de Vercel KV (ver README.md sección "Configuración local").
 */
import { kv } from "@vercel/kv";

export { kv };

/** Prefijos de claves usados en todo el proyecto — mantenerlos centralizados evita colisiones. */
export const KEYS = {
  cierre: (id: string) => `cierre:${id}`,
  cierresIndex: "cierres:index", // sorted set: score = timestamp de creación, member = id
  asesor: (telegramId: string) => `asesor:${telegramId}`,
  asesoresIndex: "asesores:index", // set de telegramIds
  usuarioAdmin: (username: string) => `admin:${username}`,
  usuariosAdminIndex: "admins:index", // set de usernames
  sesionToken: (token: string) => `sesion:${token}`,
  // Estado conversacional del bot mientras el asesor llena el formulario paso a paso
  botEstado: (telegramId: string) => `bot:estado:${telegramId}`,
} as const;

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
const NAMESPACE = "propbot-c21";

export const KEYS = {
  cierre: (id: string) => `${NAMESPACE}:cierre:${id}`,
  cierresIndex: `${NAMESPACE}:cierres:index`, // sorted set: score = timestamp de creación, member = id
  asesor: (telegramId: string) => `${NAMESPACE}:asesor:${telegramId}`,
  asesoresIndex: `${NAMESPACE}:asesores:index`, // set de telegramIds
  categoriaAsesor: (id: string) => `${NAMESPACE}:categoria-asesor:${id}`,
  categoriasAsesorIndex: `${NAMESPACE}:categorias-asesor:index`, // set de ids
  configuracionComisiones: `${NAMESPACE}:configuracion:comisiones`,
  cuentaComision: `${NAMESPACE}:configuracion:cuenta-comision`,
  metasMensuales: `${NAMESPACE}:metas:index`,
  captacionesMensuales: `${NAMESPACE}:captaciones:index`,
  usuarioAdmin: (username: string) => `${NAMESPACE}:admin:${username}`,
  usuariosAdminIndex: `${NAMESPACE}:admins:index`, // set de usernames
  sesionToken: (token: string) => `${NAMESPACE}:sesion:${token}`,
  // Estado conversacional del bot mientras el asesor llena el formulario paso a paso
  botEstado: (telegramId: string) => `${NAMESPACE}:bot:estado:${telegramId}`,
} as const;

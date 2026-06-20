# Instrucciones para GitHub Copilot — Control de Cierres C21 Rita Quiroga

Este archivo da contexto a GitHub Copilot (y Copilot Chat) sobre las convenciones de este repositorio, para que las sugerencias de código sean consistentes con lo ya construido.

## Contexto del proyecto

Sistema de registro de cierres inmobiliarios para Century 21 Rita Quiroga (Santa Cruz, Bolivia). Los asesores registran cierres vía un bot de Telegram; el equipo administrativo los revisa y exporta desde un dashboard web. Backend: Next.js 14 (App Router) + Vercel KV (Redis). Bot: grammY.

## Convenciones de código

- **Idioma**: todo el código (nombres de variables, funciones, comentarios) y la UI están en **español**. Mantén esa convención en código nuevo — no mezcles inglés salvo en nombres de librerías/APIs estándar (`useState`, `fetch`, etc.).
- **Tipos**: el dominio central vive en `types/domain.ts`. Cualquier campo nuevo de un cierre debe agregarse ahí primero, y reflejarse en:
  1. `lib/bot/estado-conversacion.ts` (preguntas del bot)
  2. `lib/bot/validadores.ts` (validación)
  3. `lib/bot/bot.ts` (flujo conversacional)
  4. `lib/repositories/cierres.ts` (persistencia)
  5. `app/api/cierres/exportar/route.ts` (columna en el Excel exportado)
  6. `components/tabla-cierres.tsx` (columna en el dashboard)
- **Acceso a datos**: nunca llames a `kv` directamente desde un componente o ruta API — siempre a través de las funciones en `lib/repositories/*`. Esto mantiene la lógica de claves de Redis centralizada en `lib/redis.ts`.
- **Autenticación**: las rutas bajo `/dashboard` y `/api/cierres`, `/api/asesores`, `/api/usuarios` ya están protegidas por `middleware.ts`. Dentro de cada ruta API, sigue verificando la sesión con `obtenerSesionActual()` y los permisos con la constante `PERMISOS` de `types/domain.ts` — el middleware solo verifica que exista un JWT válido, no el rol.
- **Server vs Client Components**: por defecto usa Server Components (sin `"use client"`). Solo agrega `"use client"` cuando el componente necesita estado, efectos o manejadores de eventos del navegador (formularios, botones interactivos).
- **Estilos**: Tailwind CSS con la paleta de marca definida en `tailwind.config.js` (`carbon-*` para fondos oscuros, `gold-*` para acentos dorados de Century 21, `signal-*` para estados ok/warn/danger). No introduzcas colores sueltos fuera de esta paleta sin necesidad real.
- **Validación**: usa `zod` para esquemas de API; para el bot, usa los validadores manuales en `lib/bot/validadores.ts` (devuelven `{ ok, value }` o `{ ok, error }` con mensaje en español listo para mostrar al asesor).

## Patrones específicos del bot de Telegram

- El flujo es una máquina de estados (`PasoFormulario` en `lib/bot/estado-conversacion.ts`). Cada paso tiene una pregunta en `PREGUNTAS` y, si aplica, un teclado inline (`InlineKeyboard` de grammY) en `lib/bot/bot.ts`.
- El estado parcial de cada conversación se persiste en Redis (`bot:estado:<telegramId>`) con TTL de 6 horas, para que el asesor pueda continuar después si cierra Telegram.
- Todo nuevo paso del formulario debe:
  1. Agregarse a `PasoFormulario` y `ORDEN_PASOS`.
  2. Tener su pregunta en `PREGUNTAS`.
  3. Tener su `case` en el switch de `bot.on("message:text", ...)` en `bot.ts`.

## Qué NO hacer

- No uses `localStorage`/`sessionStorage` en ningún componente (no aplica aquí, pero por si se reutiliza código de artifacts).
- No hardcodees tokens, secretos o URLs de producción — todo va en variables de entorno (`.env.local`, nunca comiteado).
- No reemplaces `bcryptjs` ni `jose` por alternativas sin discutirlo — son las elecciones deliberadas para compatibilidad con Edge runtime (middleware) y Node runtime (API routes) respectivamente.
- No agregues dependencias pesadas sin verificar que sean compatibles con el plan gratuito/hobby de Vercel (límites de tamaño de función, duración máxima de ejecución).

## Próximos pasos sugeridos (ver README.md sección "Roadmap")

Si te piden implementar algo del roadmap, revisa primero el README para no duplicar trabajo ni romper convenciones ya establecidas.

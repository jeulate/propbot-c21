# Control de Cierres — Century 21 Rita Quiroga

Sistema de registro y monitoreo de cierres inmobiliarios. Los asesores registran cada cierre conversando con un **bot de Telegram**; los administrativos lo revisan, verifican y exportan desde un **dashboard web** con autenticación por roles.

```
Asesor (Telegram) ──> Bot (grammY) ──> Vercel KV (Redis) ──> Dashboard (Next.js) ──> Excel
```

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework web | Next.js 14 (App Router) |
| Hosting | Vercel |
| Base de datos | Vercel KV (Redis) |
| Bot de Telegram | [grammY](https://grammy.dev) |
| Estilos | Tailwind CSS |
| Autenticación | JWT propio (`jose`) + cookies httpOnly |
| Exportación a Excel | ExcelJS |
| Gráficos | Recharts |
| CI/CD | GitHub Actions → Vercel |

## Estructura del proyecto

```
app/
  api/
    auth/login, auth/logout       → autenticación del dashboard
    cierres/                      → listar, verificar, exportar cierres
    asesores/                     → whitelist de asesores autorizados
    usuarios/                     → gestión de usuarios admin
    telegram/webhook/             → endpoint que recibe los updates del bot
  dashboard/
    page.tsx                      → resumen con métricas y gráficos
    cierres/                      → tabla completa + exportar a Excel
    asesores/                     → alta/baja de asesores autorizados
    usuarios/                     → alta de usuarios admin (solo rol ADMIN)
  login/                          → pantalla de acceso

components/                       → componentes de UI reutilizables
lib/
  bot/
    bot.ts                        → lógica conversacional del bot (grammY)
    estado-conversacion.ts        → máquina de estados paso a paso
    validadores.ts                → validación de cada campo del formulario
  repositories/
    cierres.ts, asesores.ts, usuarios-admin.ts   → acceso a datos en Redis
  auth.ts                         → JWT de sesión
  redis.ts                        → cliente de Vercel KV y claves usadas

types/domain.ts                   → tipos del dominio (mapeados al Excel original)
scripts/                          → utilidades de línea de comandos (ver abajo)
```

## Campos registrados (mapeo 1:1 con el Excel original)

El bot le pregunta al asesor, en este orden, exactamente los mismos campos del formato `CONTROL DE CIERRES`:

`FECHA CIERRE` · `ID` · `ASESOR CAPTADOR` · `ASESOR COLOCADOR` · `DIRECCIÓN DEL INMUEBLE` · `TIPO DE TRANSACCIÓN` (Venta / Alquiler / Anticrético) · `MONTO TRANSACCIÓN` · `MONTO COMISIÓN` · `T.C.` · `NOMBRE PROPIETARIO` · `TEL. PROPIETARIO` · `NOMBRE CLIENTE` · `TEL. CLIENTE` · `EXCLUSIVA (SI/NO)`

---

## 1. Configuración inicial

### 1.1. Clonar y abrir en VS Code

```bash
git clone https://github.com/<tu-usuario>/century21-control-cierres.git
cd century21-control-cierres
code .
```

Instala la extensión **GitHub Copilot** en VS Code si aún no la tienes; este repo incluye instrucciones en `.github/copilot-instructions.md` para que Copilot entienda las convenciones del proyecto.

### 1.2. Instalar dependencias

```bash
npm install
```

### 1.3. Crear el bot de Telegram

1. Abre Telegram y busca **@BotFather**.
2. Envía `/newbot`, elige un nombre y un username (debe terminar en `bot`).
3. BotFather te entregará un **token** — lo necesitas en el siguiente paso.

### 1.4. Crear el KV Store (Redis) en Vercel

1. En [vercel.com](https://vercel.com), entra a tu proyecto → **Storage** → **Create Database** → elige **KV**.
2. Una vez creado, Vercel te muestra `KV_REST_API_URL` y `KV_REST_API_TOKEN`. Cópialos.

### 1.5. Variables de entorno

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env.local
```

```env
TELEGRAM_BOT_TOKEN=el_token_de_botfather
TELEGRAM_WEBHOOK_SECRET=una_cadena_aleatoria   # openssl rand -hex 24
KV_REST_API_URL=...                            # desde Vercel KV
KV_REST_API_TOKEN=...                          # desde Vercel KV
AUTH_SECRET=...                                # openssl rand -base64 32
APP_URL=https://tu-proyecto.vercel.app         # se completa tras el primer deploy
```

### 1.6. Crear el primer usuario administrador

```bash
npm run seed:admin -- --username=admin --password=TuClaveSegura123 --nombre="Rita Quiroga" --rol=ADMIN
```

---

## 2. Desarrollo local

### 2.1. Levantar el dashboard

```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) e ingresa con el usuario creado en el paso 1.6.

### 2.2. Probar el bot localmente (modo polling)

Mientras desarrollas, no necesitas exponer tu máquina a internet: usa long-polling en vez de webhook.

```bash
npm run bot:webhook:delete   # por si ya habías configurado un webhook
npm run bot:dev
```

Abre Telegram, busca tu bot y envía `/start`. Para poder registrar cierres, primero debes agregarte como asesor autorizado desde el dashboard (`/dashboard/asesores`) usando tu ID de Telegram (pregúntaselo a `@userinfobot`).

---

## 3. Despliegue a producción (Vercel)

### 3.1. Conectar el repositorio

1. En Vercel, **Add New → Project** → importa este repositorio de GitHub.
2. Agrega las variables de entorno del paso 1.5 en **Settings → Environment Variables** (las mismas que en `.env.local`, sin `APP_URL` todavía).
3. Despliega. Vercel te dará una URL pública, ej: `https://century21-control-cierres.vercel.app`.
4. Vuelve a Settings → Environment Variables y agrega `APP_URL` con esa URL. Vuelve a desplegar (o espera al próximo push).

### 3.2. Activar el webhook de Telegram

Con `APP_URL` ya configurado en tu `.env.local` (apuntando a la URL de producción):

```bash
npm run bot:webhook:set
```

Esto le dice a Telegram que envíe los mensajes del bot a `https://tu-proyecto.vercel.app/api/telegram/webhook`.

### 3.3. CI/CD con GitHub Actions

Este repo incluye dos workflows:

- **`.github/workflows/ci.yml`** — corre en cada push/PR: lint, type-check y build. Así ningún error llega a `main`.
- **`.github/workflows/deploy.yml`** — despliega automáticamente a producción en cada push a `main`.

Para que el deploy automático funcione, agrega estos **secrets** en GitHub (`Settings → Secrets and variables → Actions`):

| Secret | De dónde sacarlo |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_PROJECT_NAME` | El nombre exacto del proyecto en Vercel |

> 💡 Alternativa más simple: si prefieres que Vercel despliegue directo sin pasar por GitHub Actions, basta con conectar el repo desde el dashboard de Vercel (deploy automático nativo). El workflow `deploy.yml` es útil si quieres controlar el pipeline desde GitHub o añadir pasos adicionales (tests, notificaciones, etc.) antes de desplegar.

---

## 4. Roles y permisos del dashboard

| Rol | Ver cierres | Verificar/rechazar | Exportar Excel | Gestionar asesores | Gestionar usuarios |
|---|---|---|---|---|---|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SUPERVISOR** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **LECTOR** | ✅ | ❌ | ✅ | ❌ | ❌ |

Los permisos están centralizados en `types/domain.ts` (`PERMISOS`) y se validan tanto en las rutas API como en la UI.

## 5. Flujo de un cierre

1. El asesor (ya autorizado por un admin) le escribe `/nuevo` al bot.
2. El bot pregunta, uno por uno, los 14 campos del Excel original, validando cada respuesta.
3. Al final, el bot muestra un resumen y pide confirmación.
4. Al confirmar, el cierre se guarda en Redis con estado `PENDIENTE_REVISION`.
5. Un administrador o supervisor lo revisa en `/dashboard/cierres` y lo marca como `VERIFICADO` o `RECHAZADO`.
6. En cualquier momento, se puede exportar todo a un `.xlsx` con el mismo formato del archivo original.

## 6. Roadmap de mejora continua

Ideas para siguientes iteraciones (el proyecto está pensado para crecer):

- [ ] Notificaciones automáticas al grupo de Telegram de la oficina cuando se verifica un cierre.
- [ ] Edición de cierres ya guardados (actualmente solo se puede cambiar el estado).
- [ ] Filtros y búsqueda en la tabla de cierres del dashboard (por fecha, asesor, tipo).
- [ ] Reportes mensuales automáticos (PDF o Excel) enviados por correo.
- [ ] Métricas de ranking de asesores por período.
- [ ] Tests automatizados (unitarios para `lib/bot/validadores.ts` y de integración para las rutas API).
- [ ] Internacionalización del bot si la oficina expande a otras franquicias.

## 7. Soporte y troubleshooting

- **El bot no responde**: verifica que el webhook esté activo con `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`.
- **"No autorizado" en el bot**: el asesor no está en la whitelist — agrégalo desde `/dashboard/asesores`.
- **Error de conexión a Redis**: revisa que `KV_REST_API_URL` y `KV_REST_API_TOKEN` estén bien copiados desde Vercel.
- **No puedo iniciar sesión en el dashboard**: confirma que corriste `npm run seed:admin` y que `AUTH_SECRET` es el mismo en desarrollo y producción si comparten datos.

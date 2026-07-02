# WA Panel — Panel de mensajería WhatsApp Business API

Aplicación Next.js para enviar y recibir mensajes a través de la **WhatsApp Cloud API oficial de Meta**, con login multiusuario (Admin / Agente), envío masivo con plantillas y recepción de mensajes vía webhook. Lista para desplegar en Vercel.

## Stack

- **Next.js 14** (App Router) — frontend + API routes (backend)
- **Prisma 7 + Prisma Postgres (Vercel Marketplace)** — base de datos serverless con pooling incluido. Nota: desde Prisma 7, la URL de conexión ya no va en `schema.prisma`, sino en `prisma.config.ts` (incluido en este proyecto).
- **JWT en cookie httpOnly** — autenticación (sin dependencias externas de auth)
- **Tailwind CSS** — estilos
- **WhatsApp Cloud API** — mensajería

---

## 1. Requisitos previos en Meta

### 1.1 Crear la app y obtener el número de WhatsApp

1. Ve a [Meta for Developers](https://developers.facebook.com/apps) y crea (o usa) tu app de tipo "Business".
2. Dentro de la app, agrega el producto **WhatsApp**.
3. En **WhatsApp > API Setup** anota:
   - `Phone Number ID`
   - `WhatsApp Business Account ID` (WABA ID)

### 1.2 Generar un token permanente (System User)

El token temporal de la pantalla de "API Setup" expira en 24h. Para producción necesitas un **token permanente**:

1. Ve a [Meta Business Suite > Configuración del negocio](https://business.facebook.com/settings) > **Usuarios > Usuarios del sistema**.
2. Crea un usuario del sistema con rol **Administrador**.
3. Asigna ese usuario del sistema a tu app de WhatsApp (con permiso de administrador sobre la app y el WABA).
4. Genera un token para ese usuario del sistema, seleccionando los permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copia ese token — **no expira** mientras el usuario del sistema exista y el permiso no se revoque. Ese es tu `WHATSAPP_TOKEN`.

### 1.3 Crear al menos una plantilla aprobada

Los envíos masivos (fuera de la ventana de 24h) **requieren usar una plantilla aprobada por Meta**. Créalas en Meta Business Suite > WhatsApp Manager > Plantillas de mensajes. La aprobación puede tardar minutos u horas.

---

## 2. Base de datos: Prisma Postgres en Vercel

> Si solo quieres tener la app corriendo en Vercel (sin tocar nada en tu PC), puedes saltarte directo a la sección 3 — ahí está el flujo 100% en Vercel. Esta sección 2 solo es necesaria si en algún momento quieres correr el proyecto en tu máquina para desarrollo.

Este proyecto usa **Prisma Postgres**, la base de datos serverless del Marketplace de Vercel — gratis para empezar, con connection pooling incluido (ideal para funciones serverless, sin que tengas que exponer ni administrar tu propio servidor).

### 2.1 Conectarla a tu proyecto de Vercel

1. Crea tu proyecto en Vercel importando el repositorio (ver sección 4) — puedes hacer esto antes o después de conectar la base, el orden no importa.
2. En tu proyecto de Vercel, ve a la pestaña **Storage**.
3. Si ya creaste la base (ej. `prisma-postgres-erin-pillar`), selecciónala y haz clic en **Connect Project**. Si no existe ninguna, haz clic en **Connect Database**, elige **Prisma** en el Marketplace, y sigue el asistente (región, plan gratuito, nombre).
4. Al conectarla, Vercel agrega automáticamente la variable `DATABASE_URL` a tu proyecto (Production y Preview) — no la escribes tú a mano.

### 2.2 Usarla también en local

Instala el CLI de Vercel y enlaza tu carpeta local con el proyecto:

```powershell
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
```

Esto descarga el `DATABASE_URL` real (el mismo que usará producción) a un archivo `.env.local`. Next.js lo carga automáticamente además de tu `.env`.

> Como es una sola base de datos compartida entre local y producción (normal en el plan gratuito), ten en cuenta que las migraciones y los datos que crees en local también aparecerán en producción. Si prefieres separarlos, crea una segunda base "Prisma Postgres" solo para desarrollo y usa esa URL en tu `.env` local en vez de la que trae `.env.local`.

### 2.3 Resto de variables de entorno

Copia `.env.example` a `.env` y completa lo que falta (todo excepto `DATABASE_URL`, que ya viene de `.env.local`):

```
JWT_SECRET="genera-uno-con: openssl rand -base64 32"
WHATSAPP_TOKEN="tu-token-permanente"
WHATSAPP_PHONE_NUMBER_ID="tu-phone-number-id"
WHATSAPP_BUSINESS_ACCOUNT_ID="tu-waba-id"
WHATSAPP_VERIFY_TOKEN="inventa-un-string-secreto"
WHATSAPP_API_VERSION="v20.0"
```

Agrega también estas variables (JWT_SECRET, WHATSAPP_*) en Vercel: **Project > Settings > Environment Variables**, para que existan en producción.

### 2.4 Crear las tablas y tu usuario admin

```powershell
npm install
npx prisma migrate dev --name init
SEED_ADMIN_EMAIL="tu@correo.com" SEED_ADMIN_PASSWORD="una-contraseña-segura" npm run seed
```

### 2.5 Correr en local

```powershell
npm run dev
```

Entra a `http://localhost:3000`, inicia sesión con el correo/contraseña del seed.

> Nota: para que Meta pueda llamar a tu webhook mientras pruebas en local necesitas exponerlo con algo como `ngrok http 3000` y usar esa URL temporalmente al configurar el webhook en Meta (sección 4).

---

## 3. Desplegar en Vercel (sin pasos locales)

Este proyecto está configurado para que **todo pase automáticamente en cada build de Vercel**: crear/actualizar las tablas de la base de datos y crear tu usuario administrador. No necesitas correr nada desde tu PC más que subir el código.

1. Sube este proyecto a un repositorio de GitHub/GitLab.
2. En [Vercel](https://vercel.com/new), importa el repositorio.
3. Conecta la base de datos Prisma Postgres (pestaña **Storage** > tu base > **Connect Project**, como se explicó en la sección 2.1) — esto agrega `DATABASE_URL` automáticamente.
4. En **Settings > Environment Variables**, agrega el resto de variables:

   | Variable | Valor |
   |---|---|
   | `JWT_SECRET` | un string largo aleatorio |
   | `WHATSAPP_TOKEN` | tu token permanente |
   | `WHATSAPP_PHONE_NUMBER_ID` | tu Phone Number ID |
   | `WHATSAPP_BUSINESS_ACCOUNT_ID` | tu WABA ID |
   | `WHATSAPP_VERIFY_TOKEN` | un string secreto que tú inventes |
   | `WHATSAPP_API_VERSION` | `v20.0` |
   | `SEED_ADMIN_EMAIL` | el correo con el que vas a iniciar sesión |
   | `SEED_ADMIN_PASSWORD` | la contraseña de ese usuario (cámbiala luego desde la BD si quieres) |
   | `SEED_ADMIN_NAME` | tu nombre (opcional) |

5. Dale **Deploy**. El build va a:
   - Generar el cliente de Prisma.
   - Sincronizar el schema con tu base de datos (crear las tablas si no existen).
   - Crear tu usuario administrador (si ya existe uno con ese correo, lo detecta y no hace nada — es seguro que esto corra en cada deploy).
   - Compilar la app de Next.js.
6. Al terminar, Vercel te da una URL fija, por ejemplo `https://tu-proyecto.vercel.app`. Ya puedes entrar y hacer login con el correo/contraseña que pusiste en `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.

> **Nota sobre este enfoque:** al usar `prisma db push` en vez de migraciones versionadas, Prisma sincroniza el schema directamente contra la base de datos en cada build, sin guardar un historial de cambios. Es la forma más simple de tener todo funcionando sin pasos manuales, pero si en el futuro quitas o cambias un campo del schema, podría eliminar datos de esa columna sin pedirte confirmación (por eso lleva la bandera `--accept-data-loss`). Si más adelante quieres más control sobre los cambios de schema, se puede cambiar a migraciones versionadas (`prisma migrate deploy`), que sí piden confirmación antes de operaciones destructivas — avísame cuando llegues a ese punto y lo ajustamos.

---

## 4. Configurar el webhook en Meta (paso clave)

1. En Meta for Developers > tu app > **WhatsApp > Configuration**.
2. En la sección **Webhook**, haz clic en **Edit**.
3. **Callback URL**: `https://tu-proyecto.vercel.app/api/webhook`
4. **Verify token**: el mismo valor que pusiste en `WHATSAPP_VERIFY_TOKEN`.
5. Haz clic en **Verify and Save**. Meta llamará a tu endpoint (`GET /api/webhook`) para confirmar — tu código ya está preparado para responder correctamente.
6. En **Webhook fields**, suscríbete al menos a:
   - `messages` (mensajes entrantes y estados de entrega)

A partir de aquí, cualquier mensaje que un usuario te escriba llegará a `POST /api/webhook` y se guardará automáticamente en la base de datos, visible en **Mensajes** dentro del panel.

---

## 5. Uso del panel

- **Login** (`/login`): acceso con correo/contraseña.
- **Mensajes** (`/dashboard/mensajes`): bandeja de conversaciones recibidas vía webhook, con opción de responder texto libre (solo funciona dentro de las 24h desde el último mensaje del contacto — regla de Meta).
- **Envío masivo** (`/dashboard/enviar-masivo`): selecciona una plantilla aprobada, pega o sube una lista de números, define variables del cuerpo, y envía. Queda registrado como "Campaña".
- **Usuarios** (`/dashboard/usuarios`, solo Admin): alta de nuevos usuarios con rol Admin o Agente.

### Límites importantes a tener en cuenta

- **Ventana de 24h**: solo puedes enviar texto libre a un contacto si te escribió en las últimas 24h. Fuera de eso, Meta obliga a usar una plantilla aprobada.
- **Límite de envío por request**: el endpoint de envío masivo procesa hasta 250 números por llamada (para no exceder el timeout de las funciones serverless de Vercel). Si tienes listas más grandes, divide el envío en varios lotes desde el frontend, o convierte ese endpoint en un job en background/cron si tu volumen es alto.
- **Rate limits de Meta**: la cuenta de WhatsApp Business tiene límites de mensajes por 24h que crecen según tu calidad de envío (Tier 1: 1,000/día al inicio, y va subiendo). Revisa tu tier en WhatsApp Manager.
- **Plan gratuito de Prisma Postgres**: tiene límites de almacenamiento y de operaciones — suficiente para pruebas y volumen moderado. Si tu envío masivo crece mucho, revisa los límites del plan en el dashboard de Vercel/Prisma y sube de plan si hace falta.

---

## 6. Estructura del proyecto

```
prisma/schema.prisma          Modelos: User, Contact, Message, Campaign
prisma.config.ts              Configuración de conexión de Prisma 7 (lee DATABASE_URL de .env/.env.local)
src/lib/db.ts                 Cliente de Prisma
src/lib/auth.ts                Hash de contraseñas, JWT, sesión
src/lib/whatsapp.ts            Cliente de la WhatsApp Cloud API
src/middleware.ts              Protección de rutas /dashboard y roles
src/app/login/                 Página de login
src/app/dashboard/             Panel (resumen, mensajes, envío masivo, usuarios)
src/app/api/webhook/           Webhook oficial (GET verificación / POST mensajes)
src/app/api/messages/          Envío individual y masivo, listado de mensajes
src/app/api/contacts/          CRUD de contactos
src/app/api/users/             Gestión de usuarios (solo admin)
src/app/api/templates/         Lista de plantillas aprobadas desde Meta
scripts/seed.ts                Crea el usuario administrador inicial
```

# Task Management App (Realtime)

App mínima de gestión de tareas con colaboración en tiempo real (Socket.IO). Backend Express + Prisma + Postgres, frontend React/Vite.

## Estructura

- `server`: API + Socket.IO, Prisma con Postgres.
- `web`: React/Vite, cliente Socket.IO.

## Requisitos locales

- Node.js 18+
- Docker Desktop (para la opción Docker Compose)

## Ejecución local (sin Docker)

1) Backend

```powershell
cd "c:\Users\emili\OneDrive\Desktop\aplicacion\server"
npm install
# Ajusta DATABASE_URL en .env (Postgres) o cambia provider a SQLite en prisma/schema.prisma
npx prisma db push
npm run dev
```

2) Frontend

```powershell
cd "c:\Users\emili\OneDrive\Desktop\aplicacion\web"
npm install
npm run dev
```

Visita http://localhost:5173.

Seed opcional (crea workspace demo/clave demo + 3 tareas):

```powershell
cd "c:\Users\emili\OneDrive\Desktop\aplicacion\server"
npm run seed
```

## Ejecución con Docker Compose (Postgres)

```powershell
cd "c:\Users\emili\OneDrive\Desktop\aplicacion"
docker compose up -d
```

- API en http://localhost:4000
- Frontend en http://localhost:5173
- El contenedor del server corre: npm install, prisma generate, prisma db push y npm run seed (workspace demo/clave demo).

Parar contenedores:

```powershell
docker compose down
```

## Variables de entorno

- Backend (`server/.env`):
	- `DATABASE_URL` (Postgres), ejemplo: `postgresql://taskapp:taskapp@localhost:5432/taskapp?schema=public`
	- `FRONTEND_ORIGIN` (CSV) para CORS/Socket.IO en producción, ej: `https://tu-frontend.vercel.app`
	- `HOST`, `PORT` (opcional)

- Frontend (`web/.env`):
	- `VITE_API_URL` apuntando al backend, ejemplo local: `http://localhost:4000` (sin slash final)

## Deploy frontend en Vercel

1) Importa el repo en Vercel: https://github.com/emi-silva/APLICATION-MANAGEMENT
2) Root Directory: `web`
3) Build Command: `npm run build`
4) Output Directory: `dist`
5) Node 18+
6) Variables de entorno en Vercel: define `VITE_API_URL` apuntando a tu backend público (sin slash final). Ej: `https://tu-backend.com`
7) Si usas dominio custom, actualiza también `FRONTEND_ORIGIN` en el backend para que CORS/Socket.IO lo permita.

## Deploy backend

- Opción contenedor: usar el mismo `docker-compose.yml` en un servidor con Docker (o empaquetar la imagen). Expone `PORT 4000` y conecta a Postgres manejado (Neon/Supabase/Railway/etc.).
- Opción PaaS: subir la carpeta `server` a Render/Railway/Fly. Configurar `DATABASE_URL` a tu instancia Postgres y ejecutar migración y seed al desplegar:

```bash
npm install
npx prisma db push
npm run seed
npm run start # o node src/index.js
```

## Uso rápido (UI)

1) Escribe un nombre de workspace (ej. demo) y clave, pulsa Crear workspace (solo primera vez).
2) Ingresa tu nombre y pulsa Conectar.
3) Crea/actualiza tareas; abre otra pestaña con el mismo workspace+clave para ver la sincronización en tiempo real.

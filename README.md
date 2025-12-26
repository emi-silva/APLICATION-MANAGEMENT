# Task Management App (Realtime)

Aplicación mínima de gestión de tareas con colaboración en tiempo real, basada en Socket.IO.

## Estructura

- `server`: Backend Node.js (Express + Socket.IO), almacenamiento en memoria por workspace.
- `web`: Frontend React (Vite), cliente Socket.IO y UI simple.

## Requisitos

- Node.js 18 o superior.

## Instalación y ejecución (Windows)

Abra dos terminales:

1. Servidor

```powershell
cd "c:\Users\emili\OneDrive\Desktop\aplicacion\server"
npm install
npm run dev
```

2. Frontend

```powershell
cd "c:\Users\emili\OneDrive\Desktop\aplicacion\web"
npm install
npm run dev
```

Luego visite: http://localhost:5173

### Seed de datos demo (opcional, Postgres local)

```powershell
cd "c:\Users\emili\OneDrive\Desktop\aplicacion\server"
npx prisma db push
npm run seed
```

## Uso rápido

1) Crear workspace

- En la columna izquierda, escribe el nombre (ej. `demo`) y una **clave**.
- Pulsa **Crear workspace** (solo la primera vez).

2) Conectarte

- Escribe tu nombre y pulsa **Conectar** para unirte al workspace con esa clave.
- Crea tareas y cambia su estado; abre otra pestaña con el mismo nombre y clave para ver presencia y sincronización en tiempo real.

## Próximos pasos (sugerencias)

## Docker Compose (Postgres)

Alternativa reproducible con Postgres via Docker Compose:

```powershell
cd "c:\Users\emili\OneDrive\Desktop\aplicacion"
docker compose up
```

- Backend quedará en `http://localhost:4000`.
- Frontend en `http://localhost:5173`.
- Primera vez, el contenedor del `server` ejecuta `prisma db push` para crear tablas.
- También ejecuta `npm run seed` para crear el workspace `demo` con clave `demo` y 3 tareas de muestra.

Si quieres parar los contenedores:

```powershell
docker compose down
```

Nota: el `schema.prisma` está configurado para Postgres. En ejecución local sin Docker puedes volver a SQLite ajustando el provider y la `DATABASE_URL` a `file:./dev.db` y ejecutar `npx prisma migrate dev`. 

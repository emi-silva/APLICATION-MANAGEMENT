const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const store = require('./store');
const { findWorkspaceByName, createWorkspace } = require('./db');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '127.0.0.1';

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const corsConfig = {
  origin: allowedOrigins.length ? allowedOrigins : defaultOrigins,
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(cors(corsConfig));

app.get('/health', (req, res) => res.json({ ok: true }));

// Crear workspace con clave (REST)
app.post('/api/workspaces', async (req, res) => {
  try {
    const { name, secret } = req.body || {};
    if (!name || !secret) return res.status(400).json({ error: 'name y secret requeridos' });
    const existing = await findWorkspaceByName(name);
    if (existing) return res.status(409).json({ error: 'Workspace ya existe' });
    const secretHash = await bcrypt.hash(secret, 10);
    const ws = await createWorkspace(name, secretHash);
    res.status(201).json({ id: ws.id, name: ws.name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error creando workspace' });
  }
});

// REST de apoyo (útil para pruebas/herramientas)
app.get('/api/:workspaceId/tasks', async (req, res) => {
  const { workspaceId } = req.params;
  const tasks = await store.listTasks(workspaceId);
  res.json(tasks);
});

app.post('/api/:workspaceId/tasks', async (req, res) => {
  const { workspaceId } = req.params;
  const task = await store.createTask(workspaceId, req.body || {});
  if (!task) return res.status(404).json({ error: 'Workspace no encontrado' });
  res.status(201).json(task);
});

app.patch('/api/:workspaceId/tasks/:id', async (req, res) => {
  const { workspaceId, id } = req.params;
  const updated = await store.updateTask(workspaceId, id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Task not found' });
  res.json(updated);
});

app.delete('/api/:workspaceId/tasks/:id', async (req, res) => {
  const { workspaceId, id } = req.params;
  const removed = await store.deleteTask(workspaceId, id);
  if (!removed) return res.status(404).json({ error: 'Task not found' });
  res.json(removed);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : defaultOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  // Unirse a un workspace/room y anunciar presencia
  socket.on('room:join', async ({ workspaceId, secret, user }) => {
    try {
      if (!workspaceId) return;
      const ws = await findWorkspaceByName(workspaceId);
      if (!ws) {
        socket.emit('room:error', { error: 'Workspace no existe' });
        return;
      }
      const ok = await bcrypt.compare(secret || '', ws.secretHash);
      if (!ok) {
        socket.emit('room:error', { error: 'Clave inválida' });
        return;
      }
      socket.join(workspaceId);
      store.setPresence(workspaceId, socket.id, user);
      io.to(workspaceId).emit('presence:update', store.listPresence(workspaceId));
      const tasks = await store.listTasks(workspaceId);
      socket.emit('tasks:sync', tasks);
    } catch (e) {
      console.error(e);
      socket.emit('room:error', { error: 'Error al unirse' });
    }
  });

  // CRUD tareas en tiempo real
  socket.on('task:create', async ({ workspaceId, task }) => {
    if (!workspaceId) return;
    const created = await store.createTask(workspaceId, task || {});
    if (created) io.to(workspaceId).emit('tasks:created', created);
  });

  socket.on('task:update', async ({ workspaceId, id, updates }) => {
    if (!workspaceId) return;
    const updated = await store.updateTask(workspaceId, id, updates || {});
    if (updated) io.to(workspaceId).emit('tasks:updated', updated);
  });

  socket.on('task:delete', async ({ workspaceId, id }) => {
    if (!workspaceId) return;
    const removed = await store.deleteTask(workspaceId, id);
    if (removed) io.to(workspaceId).emit('tasks:deleted', removed);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        store.removePresence(room, socket.id);
        io.to(room).emit('presence:update', store.listPresence(room));
      }
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Task App server escuchando en http://${HOST}:${PORT}`);
});

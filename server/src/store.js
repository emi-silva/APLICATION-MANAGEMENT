const workspaces = new Map();
const db = require('./db');

function ensurePresenceWorkspace(workspaceName) {
  if (!workspaces.has(workspaceName)) {
    workspaces.set(workspaceName, {
      presence: new Map(),
    });
  }
  return workspaces.get(workspaceName);
}

async function listTasks(workspaceName) {
  return db.listTasksByWorkspaceName(workspaceName);
}

async function createTask(workspaceName, payload) {
  return db.createTask(workspaceName, payload);
}

async function updateTask(workspaceName, id, updates) {
  return db.updateTask(workspaceName, id, updates);
}

async function deleteTask(workspaceName, id) {
  return db.deleteTask(workspaceName, id);
}

function setPresence(workspaceName, socketId, user) {
  const ws = ensurePresenceWorkspace(workspaceName);
  ws.presence.set(socketId, {
    id: socketId,
    name: user?.name || 'Invitado',
    color: user?.color || '#4f46e5',
    joinedAt: new Date().toISOString(),
  });
}

function removePresence(workspaceName, socketId) {
  const ws = ensurePresenceWorkspace(workspaceName);
  ws.presence.delete(socketId);
}

function listPresence(workspaceName) {
  const ws = ensurePresenceWorkspace(workspaceName);
  return Array.from(ws.presence.values());
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  setPresence,
  removePresence,
  listPresence,
};

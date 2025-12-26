const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function isSQLite() {
  const url = process.env.DATABASE_URL || '';
  return url.startsWith('file:');
}

async function findWorkspaceByName(name) {
  return prisma.workspace.findUnique({ where: { name } });
}

async function createWorkspace(name, secretHash) {
  return prisma.workspace.create({ data: { name, secretHash } });
}

async function listTasksByWorkspaceName(workspaceName) {
  const ws = await prisma.workspace.findUnique({ where: { name: workspaceName } });
  if (!ws) return [];
  const tasks = await prisma.task.findMany({ where: { workspaceId: ws.id }, orderBy: { createdAt: 'desc' } });
  return tasks.map(t => ({
    ...t,
    assignees: (typeof t.assignees === 'string') ? (t.assignees ? JSON.parse(t.assignees) : []) : (t.assignees || []),
    labels: (typeof t.labels === 'string') ? (t.labels ? JSON.parse(t.labels) : []) : (t.labels || []),
  }));
}

async function createTask(workspaceName, payload) {
  const ws = await prisma.workspace.findUnique({ where: { name: workspaceName } });
  if (!ws) return null;
  const id = payload.id || require('crypto').randomUUID();
  const data = {
    id,
    title: payload.title || 'Nueva tarea',
    description: payload.description || '',
    status: payload.status || 'todo',
    assignees: Array.isArray(payload.assignees) ? (isSQLite() ? JSON.stringify(payload.assignees) : payload.assignees) : (isSQLite() ? JSON.stringify([]) : []),
    labels: Array.isArray(payload.labels) ? (isSQLite() ? JSON.stringify(payload.labels) : payload.labels) : (isSQLite() ? JSON.stringify([]) : []),
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    workspaceId: ws.id,
  };
  return prisma.task.create({ data });
}

async function updateTask(workspaceName, id, updates) {
  const ws = await prisma.workspace.findUnique({ where: { name: workspaceName } });
  if (!ws) return null;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.workspaceId !== ws.id) return null;
  const data = {
    title: updates.title ?? task.title,
    description: updates.description ?? task.description,
    status: updates.status ?? task.status,
    assignees: Array.isArray(updates.assignees)
      ? (isSQLite() ? JSON.stringify(updates.assignees) : updates.assignees)
      : (updates.assignees === undefined ? task.assignees : (isSQLite() ? JSON.stringify([]) : [])),
    labels: Array.isArray(updates.labels)
      ? (isSQLite() ? JSON.stringify(updates.labels) : updates.labels)
      : (updates.labels === undefined ? task.labels : (isSQLite() ? JSON.stringify([]) : [])),
    dueDate: updates.dueDate ? new Date(updates.dueDate) : updates.dueDate === null ? null : task.dueDate,
  };
  return prisma.task.update({ where: { id }, data });
}

async function deleteTask(workspaceName, id) {
  const ws = await prisma.workspace.findUnique({ where: { name: workspaceName } });
  if (!ws) return null;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.workspaceId !== ws.id) return null;
  await prisma.task.delete({ where: { id } });
  return task;
}

module.exports = {
  prisma,
  findWorkspaceByName,
  createWorkspace,
  listTasksByWorkspaceName,
  createTask,
  updateTask,
  deleteTask,
};

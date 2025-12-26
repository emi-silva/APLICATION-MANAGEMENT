const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const secret = 'demo';
  const secretHash = await bcrypt.hash(secret, 10);

  const workspace = await prisma.workspace.upsert({
    where: { name: 'demo' },
    update: { secretHash },
    create: { name: 'demo', secretHash },
  });

  const tasks = [
    {
      id: crypto.randomUUID(),
      title: 'Preparar backlog inicial',
      description: 'Define las primeras 5 tareas para el equipo.',
      status: 'doing',
      labels: ['planificacion'],
    },
    {
      id: crypto.randomUUID(),
      title: 'Configurar CI/CD',
      description: 'Pipeline de pruebas y deploy (placeholder).',
      status: 'todo',
      labels: ['devops'],
    },
    {
      id: crypto.randomUUID(),
      title: 'Diseño de UI',
      description: 'Wireframes básicos para la vista de tareas.',
      status: 'todo',
      labels: ['ux'],
    },
  ];

  // createMany con skipDuplicates para idempotencia básica
  await prisma.task.createMany({
    data: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      assignees: [],
      labels: t.labels,
      workspaceId: workspace.id,
    })),
    skipDuplicates: true,
  });

  console.log('Seed completado: workspace demo + tareas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

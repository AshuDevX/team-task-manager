const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const memberPassword = await bcrypt.hash('member123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword
    }
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      name: 'Team Member',
      email: 'member@example.com',
      password: memberPassword
    }
  });

  // Create a project
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-001' },
    update: {},
    create: {
      id: 'seed-project-001',
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' }
        ]
      }
    }
  });

  // Create tasks
  const tasks = [
    { title: 'Design new homepage mockup', status: 'DONE', priority: 'HIGH', assigneeId: admin.id },
    { title: 'Implement responsive navbar', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: member.id },
    { title: 'Write content for About page', status: 'TODO', priority: 'MEDIUM', assigneeId: member.id },
    { title: 'Set up CI/CD pipeline', status: 'TODO', priority: 'LOW', assigneeId: admin.id },
    {
      title: 'Fix mobile layout bug',
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: member.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago (overdue)
    }
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        projectId: project.id,
        creatorId: admin.id
      }
    });
  }

  console.log('✅ Seed complete!');
  console.log('📧 Admin: admin@example.com / admin123');
  console.log('📧 Member: member@example.com / member123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

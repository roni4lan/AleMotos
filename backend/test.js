const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const where = {};
  where.fechaIngreso = {};
  
  const start = new Date(`2026-07-21T00:00:00.000-03:00`);
  where.fechaIngreso.gte = start;
  
  const end = new Date(`2026-07-21T23:59:59.999-03:00`);
  where.fechaIngreso.lte = end;
  
  const records = await prisma.reparacion.findMany({ where });
  console.log('Result count:', records.length);
  for (const r of records) {
    console.log(r.id, r.fechaIngreso);
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());

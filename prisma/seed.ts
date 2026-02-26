import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Iniciando seeding con Prisma 7 y Postgres Adapter...');

  await prisma.product.deleteMany();

  const products = [
    { name: 'Reloj Inteligente Sport v2', description: 'GPS y ritmo cardíaco.', price: 150000, stock: 15 },
    { name: 'Audífonos Noise Cancelling', description: 'Batería 30h.', price: 850000, stock: 8 },
    { name: 'Cargador Carga Rápida 65W', description: 'Puerto USB-C.', price: 120000, stock: 50 },
    { name: 'Mouse Ergonómico Wireless', description: '4000 DPI.', price: 210000, stock: 12 }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('✅ Seeder completado con éxito.'); 
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); 
  });
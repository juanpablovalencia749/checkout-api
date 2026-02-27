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
  { name: 'Reloj Inteligente Sport v2', description: 'GPS y ritmo cardíaco.', price: 150000, stock: 15, image: 'https://http2.mlstatic.com/D_NQ_NP_2X_814340-MLA50102232537_052022-F.webp' },
  { name: 'Audífonos Noise Cancelling', description: 'Audio cristalino sin cables.', price: 850000, stock: 8, image: 'https://http2.mlstatic.com/D_NQ_NP_2X_991233-MLA49647336032_042022-F.webp' },
  { name: 'Cargador Carga Rápida 65W', description: 'Puerto USB‑C Smart.', price: 120000, stock: 50, image: 'https://icdn03.ibytedtos.com/obj/esim-fusion/app_product/4188abda1d0042ddb3b89c45d04538bc.webp' },
  { name: 'Mouse Ergonómico Wireless', description: 'Diseño cómodo e inalámbrico.', price: 210000, stock: 12, image: 'https://cdn.shopify.com/s/files/1/0253/0965/0498/products/wireless-mouse.webp' }
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
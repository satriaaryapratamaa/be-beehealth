import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Sedang membersihkan database...');
  
  try {
    const deletedLogs = await prisma.foodLog.deleteMany({});
    console.log(`✅ Menghapus ${deletedLogs.count} riwayat FoodLog.`);

    const deletedFood = await prisma.food.deleteMany({});
    console.log(`✅ Menghapus ${deletedFood.count} data Makanan (Master Data).`);
    
    console.log('✨ Tabel Food & FoodLog sekarang bersih!');
  } catch (error) {
    console.error('❌ Gagal menghapus data:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
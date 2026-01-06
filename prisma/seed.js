import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
  const results = [];
  const csvFilePath = path.join(__dirname, 'nutrition.csv');

  console.log('🧹 Membersihkan database lama...');
  try {
    await prisma.food.deleteMany({});
  } catch (e) {
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: File tidak ditemukan di ${csvFilePath}`);
    process.exit(1);
  }

  console.log('📂 Membaca file nutrition.csv...');

  let barisPertama = true;

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      
      // --- LOGIKA NORMALISASI HEADER (Script Anti-Gagal) ---
      // Kita ubah semua key menjadi huruf kecil & hilangkan spasi
      // Contoh: " Image " -> "image", "Name" -> "name"
      const cleanRow = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.trim().toLowerCase();
        cleanRow[cleanKey] = row[key];
      });

      // DEBUG: Tampilkan header yang terbaca di baris pertama
      if (barisPertama) {
        console.log('🔍 HEADER YANG TERDETEKSI:', Object.keys(cleanRow));
        // Cek apakah kolom image ada
        if (!cleanRow['image']) {
          console.warn('⚠️  PERINGATAN: Kolom "image" tidak ditemukan di header CSV!');
          console.warn('   Pastikan file CSV sudah disave dengan header "image" di baris 1.');
        }
        barisPertama = false;
      }

      // Mapping Data (Menggunakan key yang sudah dibersihkan)
      const namaMakanan = cleanRow['name'] || cleanRow['fooditem'] || cleanRow['nama'];
      
      if (namaMakanan) {
        results.push({
          nama: namaMakanan,
          kalori: parseFloat(cleanRow['calories'] || cleanRow['kalori'] || 0),
          protein: parseFloat(cleanRow['proteins'] || cleanRow['protein'] || 0),
          fat: parseFloat(cleanRow['fat'] || cleanRow['lemak'] || 0),
          carbs: parseFloat(cleanRow['carbohydrate'] || cleanRow['carbs'] || 0),
          
          // Script akan mencari kolom 'image', 'img', atau 'url' otomatis
          image: cleanRow['image'] || cleanRow['img'] || cleanRow['url'] || null,
        });
      }
    })
    .on('end', async () => {
      console.log(`📦 Menemukan ${results.length} data. Mulai upload...`);
      
      try {
        await prisma.food.createMany({
          data: results,
          skipDuplicates: true,
        });
        console.log('🎉 Selesai! Cek kembali Prisma Studio.');
      } catch (error) {
        console.error('❌ Gagal upload:', error);
      } finally {
        await prisma.$disconnect();
      }
    });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
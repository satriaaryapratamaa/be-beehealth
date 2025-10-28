// server.js

// Ganti cara import dotenv
import 'dotenv/config'; 
import { prisma } from './src/lib/prisma.js';
import { createApp } from './src/app.js';

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Database berhasil terhubung!');

        const app = createApp(prisma); // 'prisma' ini di-impor dari lib

        app.listen(PORT, () => {
            console.log(`Server berjalan di http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Gagal terhubung ke database:');
        console.error(error);
        process.exit(1);
    }
}
main();
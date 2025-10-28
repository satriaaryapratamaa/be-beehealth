// src/app.js

import express from 'express';
import cors from 'cors';

// Import SEMUA rute yang sudah kita buat
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import foodRoutes from './routes/food.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';

// Ubah file ini menjadi FUNGSI yang di-export
export function createApp(prisma) {
    const app = express();

  // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

  // Middleware untuk inject prisma client ke setiap request
    app.use((req, res, next) => {
        req.prisma = prisma;
        next();
    });

  // Rute API
    app.get('/api', (req, res) => {
        res.json({ message: 'Selamat datang di API BeeHealth! 🐝' });
    });

  // Gunakan semua rute
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/food', foodRoutes);
    app.use('/api/exercise', exerciseRoutes);

    return app;
}
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import foodRoutes from './routes/food.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import logRoutes from './routes/log.routes.js';


export function createApp(prisma) {
    const app = express();

    app.use(cors({
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'ngrok-skip-browser-warning'
        ]
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use((req, res, next) => {
        req.prisma = prisma;
        next();
    });

    app.get('/api', (req, res) => {
        res.json({ message: 'Selamat datang di API BeeHealth!' });
    });
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/food', foodRoutes);
    app.use('/api/exercise', exerciseRoutes);
    app.use('/api/logs', logRoutes);

    return app;
}
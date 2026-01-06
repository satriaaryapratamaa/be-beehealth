import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/log.model.js', () => ({
    createFoodlog: jest.fn(),
    createExerciselog: jest.fn(),
    upsertDailySummary: jest.fn(),
    getDailyLogs: jest.fn(),
    deleteFoodLogById: jest.fn(),
    deleteExerciseLogById: jest.fn()
}));


jest.unstable_mockModule('../src/models/user.model.js', () => ({
    updateUserStreak: jest.fn()
}));

const mockPrisma = {
    food: { findUnique: jest.fn() },
    exercise: { findUnique: jest.fn(), findFirst: jest.fn() },
    foodLog: { findUnique: jest.fn() },
    exerciseLog: { findUnique: jest.fn() }
};

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
    prisma: mockPrisma
}));

const LogController = await import('../src/controllers/log.controller.js');
const LogModel = await import('../src/models/log.model.js');
const UserModel = await import('../src/models/user.model.js');
const { prisma } = await import('../src/lib/prisma.js');

describe('Log Controller Unit Testing', () => {
    let req, res;

    beforeEach(() => {
        req = { 
            body: {}, 
            params: {}, 
            query: {}, 
            user: { userId: 'user-123' } 
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // --- LOG FOOD ---
    describe('logFood', () => {
        test('Sukses mencatat makanan (200)', async () => {
            req.body = { foodNama: 'Nasi', mealType: 'SARAPAN', porsi: 1, tanggal: '2023-01-01' };
            
            // Mock Prisma cari makanan
            prisma.food.findUnique.mockResolvedValue({ id: 'food-1', nama: 'Nasi', kalori: 100 });
            // Mock Create Log
            LogModel.createFoodlog.mockResolvedValue({ id: 'log-1', tanggal: new Date() });
            
            await LogController.logFood(req, res);

            expect(prisma.food.findUnique).toHaveBeenCalled();
            expect(LogModel.createFoodlog).toHaveBeenCalled();
            expect(LogModel.upsertDailySummary).toHaveBeenCalled(); 
            expect(UserModel.updateUserStreak).toHaveBeenCalled(); 
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Gagal - Input tidak lengkap (400)', async () => {
            req.body = { foodNama: '' }; // Mealtype & Porsi hilang
            await LogController.logFood(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('Gagal - Makanan tidak ditemukan di DB (404)', async () => {
            req.body = { foodNama: 'Batu', mealType: 'SARAPAN', porsi: 1 };
            prisma.food.findUnique.mockResolvedValue(null); // Tidak ketemu

            await LogController.logFood(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('tidak ditemukan') }));
        });
    });

    // --- LOG EXERCISE ---
    describe('logExercise', () => {
        test('Sukses mencatat olahraga by ID (200)', async () => {
            req.body = { exerciseId: 'ex-1', durationInMinute: 30, tanggal: '2023-01-01' };

            // Mock Prisma cari exercise
            prisma.exercise.findUnique.mockResolvedValue({ id: 'ex-1', namaKegiatan: 'Lari', caloriesBurnPerMinute: 10 });
            LogModel.createExerciselog.mockResolvedValue({ id: 'log-ex-1' });

            await LogController.logExercise(req, res);

            expect(LogModel.upsertDailySummary).toHaveBeenCalled();
            expect(UserModel.updateUserStreak).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Gagal - Input Durasi Kosong (400)', async () => {
            req.body = { exerciseId: 'ex-1' }; // Durasi hilang
            await LogController.logExercise(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('Gagal - Olahraga tidak ditemukan (404)', async () => {
            req.body = { exerciseId: 'ex-99', durationInMinute: 10 };
            prisma.exercise.findUnique.mockResolvedValue(null);

            await LogController.logExercise(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // --- GET DAILY LOGS ---
    describe('getDailyLogs', () => {
        test('Sukses mengambil data harian (200)', async () => {
            const mockResult = {
                foodLogs: [],
                exerciseLogs: [],
                summary: { totalCaloriesIn: 500, totalCaloriesOut: 200 }
            };
            LogModel.getDailyLogs.mockResolvedValue(mockResult);

            await LogController.getDailyLogs(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ summary: mockResult.summary }));
        });
    });

    // --- DELETE FOOD LOG ---
    describe('deleteFoodLog', () => {
        test('Sukses menghapus log makanan (200)', async () => {
            req.params.id = 'log-1';
            
            // Mock Cek Log (Pastikan milik user yg sama)
            prisma.foodLog.findUnique.mockResolvedValue({ id: 'log-1', userId: 'user-123' });
            
            // Mock Delete (Return data yg dihapus utk hitung kalori)
            LogModel.deleteFoodLogById.mockResolvedValue({ 
                food: { kalori: 100 }, 
                porsi: 1, 
                tanggal: new Date() 
            });

            await LogController.deleteFoodLog(req, res);

            expect(LogModel.deleteFoodLogById).toHaveBeenCalled();
            expect(LogModel.upsertDailySummary).toHaveBeenCalled(); // Harus update summary (dikurangi)
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Gagal - Log bukan milik user / tidak ada (404)', async () => {
            req.params.id = 'log-1';
            // User beda ('user-lain')
            prisma.foodLog.findUnique.mockResolvedValue({ id: 'log-1', userId: 'user-lain' });

            await LogController.deleteFoodLog(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // --- DELETE EXERCISE LOG ---
    describe('deleteExerciseLog', () => {
        test('Sukses menghapus log olahraga (200)', async () => {
            req.params.id = 'log-ex-1';
            
            prisma.exerciseLog.findUnique.mockResolvedValue({ id: 'log-ex-1', userId: 'user-123' });
            
            LogModel.deleteExerciseLogById.mockResolvedValue({
                exercise: { caloriesBurnPerMinute: 10 },
                durationInMinutes: 30,
                tanggal: new Date()
            });

            await LogController.deleteExerciseLog(req, res);

            expect(LogModel.deleteExerciseLogById).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

});
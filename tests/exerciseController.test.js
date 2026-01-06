import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/exercise.model.js', () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
}));


const ExerciseController = await import('../src/controllers/exercise.controller.js');
const ExerciseModel = await import('../src/models/exercise.model.js');


describe('Exercise Controller Unit Testing', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // TEST CREATE EXERCISE 
    describe('createExercise', () => {
        test('Harus return 201 jika data berhasil ditambahkan', async () => {
            req.body = { namaKegiatan: 'Lari', caloriesBurnPerMinute: 10 };
            
            ExerciseModel.create.mockResolvedValue({ id: 1, ...req.body });

            await ExerciseController.createExercise(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Data olahraga berhasil ditambahkan'
            }));
        });

        test('Harus return 400 jika field ada yang kosong', async () => {
            req.body = { namaKegiatan: '', caloriesBurnPerMinute: 10 }; // Nama kosong

            await ExerciseController.createExercise(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Semua field wajib diisi.' });
        });

        test('Harus return 400 jika nama olahraga duplikat (Error P2002)', async () => {
            req.body = { namaKegiatan: 'Lari', caloriesBurnPerMinute: 10 };
            
            // Simulasi error Prisma Unique Constraint
            const prismaError = new Error('Unique constraint failed');
            prismaError.code = 'P2002';
            ExerciseModel.create.mockRejectedValue(prismaError);

            await ExerciseController.createExercise(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Nama olahraga sudah ada.' });
        });
    });

    // TEST GET ALL EXERCISES 
    describe('getAllExercises', () => {
        test('Harus return 200 dan array data', async () => {
            const mockData = [{ id: 1, namaKegiatan: 'Lari' }];
            ExerciseModel.findAll.mockResolvedValue(mockData);

            await ExerciseController.getAllExercises(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ data: mockData });
        });

        test('Harus return 500 jika server error', async () => {
            ExerciseModel.findAll.mockRejectedValue(new Error('DB Error'));

            await ExerciseController.getAllExercises(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // TEST GET EXERCISE BY ID 
    describe('getExerciseById', () => {
        test('Harus return 200 jika data ditemukan', async () => {
            req.params.id = '1';
            const mockData = { id: 1, namaKegiatan: 'Lari' };
            ExerciseModel.findById.mockResolvedValue(mockData);

            await ExerciseController.getExerciseById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ data: mockData });
        });

        test('Harus return 404 jika data tidak ditemukan', async () => {
            req.params.id = '999';
            ExerciseModel.findById.mockResolvedValue(null);

            await ExerciseController.getExerciseById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Olahraga tidak ditemukan.' });
        });
    });

    // TEST UPDATE EXERCISE 
    describe('updateExercise', () => {
        test('Harus return 200 jika update berhasil', async () => {
            req.params.id = '1';
            req.body = { namaKegiatan: 'Lari Cepat' };
            
            ExerciseModel.update.mockResolvedValue({ id: 1, namaKegiatan: 'Lari Cepat' });

            await ExerciseController.updateExercise(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Data olahraga berhasil diupdate'
            }));
        });

        test('Harus return 404 jika ID tidak ditemukan (Error P2025)', async () => {
            req.params.id = '999';
            
            const prismaError = new Error('Record not found');
            prismaError.code = 'P2025';
            ExerciseModel.update.mockRejectedValue(prismaError);

            await ExerciseController.updateExercise(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Olahraga tidak ditemukan.' });
        });
    });

    // TEST DELETE EXERCISE 
    describe('deleteExercise', () => {
        test('Harus return 200 jika hapus berhasil', async () => {
            req.params.id = '1';
            ExerciseModel.remove.mockResolvedValue(true);

            await ExerciseController.deleteExercise(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Data olahraga berhasil dihapus.' });
        });

        test('Harus return 404 jika ID tidak ditemukan saat hapus', async () => {
            req.params.id = '999';
            
            const prismaError = new Error('Record not found');
            prismaError.code = 'P2025';
            ExerciseModel.remove.mockRejectedValue(prismaError);

            await ExerciseController.deleteExercise(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Olahraga tidak ditemukan.' });
        });
    });
});
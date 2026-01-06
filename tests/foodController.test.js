import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/food.model.js', () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
}));

const FoodController = await import('../src/controllers/food.controller.js');
const FoodModel = await import('../src/models/food.model.js');

describe('Food Controller Tests', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {}, user: { userId: '1' } };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    // CREATE FOOD 
    describe('createFood', () => {
        test('Sukses (201)', async () => {
            req.body = { nama: 'Apel', kalori: 50, protein: 1, carbs: 10, fat: 5 };
            
            FoodModel.create.mockResolvedValue(req.body);
            
            await FoodController.createFood(req, res);
            
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('Gagal - Input Kosong (400)', async () => {
            req.body = { nama: '' }; 
            await FoodController.createFood(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('Gagal - Nama Duplikat (400)', async () => {
            req.body = { nama: 'Apel', kalori: 50, protein: 1, carbs: 10, fat: 5 };
            
            FoodModel.create.mockRejectedValue({ code: 'P2002' });
            
            await FoodController.createFood(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Nama makanan sudah ada.' });
        });
    });

    // GET ALL FOOD 
    describe('getAllFood', () => {
        test('Sukses (200)', async () => {
            FoodModel.findAll.mockResolvedValue([]);
            await FoodController.getAllFood(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // SHOWED FOOD (TOP 5) 
    describe('showedFood', () => {
        test('Sukses - Slice data (200)', async () => {
            const longArray = [1, 2, 3, 4, 5, 6]; 
            FoodModel.findAll.mockResolvedValue(longArray);
            await FoodController.showedFood(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ data: [1, 2, 3, 4, 5] });
        });
    });

    // GET FOOD BY ID 
    describe('getFoodById', () => {
        test('Sukses (200)', async () => {
            req.params.nama = 'Nasi';
            FoodModel.findAll.mockResolvedValue({ nama: 'Nasi' });
            await FoodController.getFoodById(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Gagal - Tidak Ketemu (404)', async () => {
            req.params.nama = 'Hantu';
            FoodModel.findAll.mockResolvedValue(null);
            await FoodController.getFoodById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // UPDATE FOOD 
    describe('updateFood', () => {
        test('Sukses (200)', async () => {
            req.params.id = '1';
            FoodModel.update.mockResolvedValue({ id: '1', nama: 'Baru' });
            await FoodController.updateFood(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Gagal - ID Tidak Ada (404)', async () => {
            req.params.id = '999';
            FoodModel.update.mockRejectedValue({ code: 'P2025' });
            await FoodController.updateFood(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // DELETE FOOD 
    describe('deleteFood', () => {
        test('Sukses (200)', async () => {
            req.params.nama = 'Nasi';
            FoodModel.remove.mockResolvedValue(true);
            await FoodController.deleteFood(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Gagal - Tidak Ketemu (404)', async () => {
            req.params.nama = 'Hantu';
            FoodModel.remove.mockRejectedValue({ code: 'P2025' });
            await FoodController.deleteFood(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
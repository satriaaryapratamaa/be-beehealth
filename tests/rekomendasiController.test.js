import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/rekomendasi.model.js', () => ({
    getRequiredRecommendationData: jest.fn()
}));

const RekomendasiController = await import('../src/controllers/rekomendasi.controller.js');
const RekomendasiModel = await import('../src/models/rekomendasi.model.js');

describe('Rekomendasi Controller Tests', () => {
    let req, res;

    // Helper: Reset req/res sebelum tiap test
    beforeEach(() => {
        req = { 
            user: { userId: 'user-123' } 
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // SKENARIO 1: DATA PROFILE BELUM LENGKAP 
    test('Return CALCULATE_REQUIRED jika target kalori belum diset', async () => {
        RekomendasiModel.getRequiredRecommendationData.mockResolvedValue({
            userProfile: null, // atau { targetCalories: null }
            dailyLogs: {},
            allFoods: [],
            allExercises: []
        });

        await RekomendasiController.getRekomendasi(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            summary: { status: "CALCULATE_REQUIRED" }
        }));
    });

    // SKENARIO 2: STATUS NEEDS_FOOD 
    test('Return NEEDS_FOOD dan rekomendasi makanan', async () => {
        // Mock Data Lengkap
        const mockData = {
            userProfile: { 
                targetCalories: 2000, 
                targetProtein: 150, targetCarbs: 200, targetFat: 60 
            },
            dailyLogs: {
                foodLogs: [
                    // Makan: 500 kalori
                    { porsi: 1, food: { kalori: 500, protein: 20, carbs: 50, fat: 10 } }
                ],
                exerciseLogs: []
            },
            allFoods: [{ id: 1, nama: 'Apel' }, { id: 2, nama: 'Roti' }], // Dummy data makanan
            allExercises: []
        };

        RekomendasiModel.getRequiredRecommendationData.mockResolvedValue(mockData);

        await RekomendasiController.getRekomendasi(req, res);

        // Perhitungan:
        // Target: 2000, Masuk: 500, Sisa: 1500 (> 200) -> NEEDS_FOOD
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            summary: expect.objectContaining({
                status: "NEEDS_FOOD",
                remaining: 1500
            }),
            // Harus ada rekomendasi makanan
            recommendations: expect.objectContaining({
                food: expect.any(Array),
                exercise: [] // Exercise kosong
            })
        }));
    });

    // SKENARIO 3: STATUS NEEDS_EXERCISE 
    test('Return NEEDS_EXERCISE dan rekomendasi olahraga', async () => {
        const mockData = {
            userProfile: { targetCalories: 1500 }, // Target kecil
            dailyLogs: {
                foodLogs: [
                    // Makan: 2000 kalori
                    { porsi: 2, food: { kalori: 1000, protein: 50, carbs: 100, fat: 20 } }
                ],
                exerciseLogs: []
            },
            allFoods: [],
            allExercises: [{ id: 1, namaKegiatan: 'Lari' }]
        };

        RekomendasiModel.getRequiredRecommendationData.mockResolvedValue(mockData);

        await RekomendasiController.getRekomendasi(req, res);

        // Perhitungan:
        // Target: 1500, Masuk: 2000, Sisa: -500 (< -200) -> NEEDS_EXERCISE

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            summary: expect.objectContaining({
                status: "NEEDS_EXERCISE",
                remaining: -500
            }),
            recommendations: expect.objectContaining({
                food: [], // Makanan kosong
                exercise: expect.any(Array) // Harus ada olahraga
            })
        }));
    });

    // SKENARIO 4: STATUS MAINTAINED 
    test('Return MAINTAINED jika kalori dalam batas wajar', async () => {
        const mockData = {
            userProfile: { targetCalories: 2000 },
            dailyLogs: {
                foodLogs: [
                    // Makan: 1900 kalori (Sisa 100, masih aman di range -200 s/d 200)
                    { porsi: 1, food: { kalori: 1900, protein: 0, carbs: 0, fat: 0 } }
                ],
                exerciseLogs: []
            },
            allFoods: [{ id: 1 }],
            allExercises: []
        };

        RekomendasiModel.getRequiredRecommendationData.mockResolvedValue(mockData);

        await RekomendasiController.getRekomendasi(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            summary: expect.objectContaining({ status: "MAINTAINED" })
        }));
    });

    // SKENARIO 5: PERHITUNGAN NET CALORIES
    test('Menghitung Net Calories dengan benar (Makanan - Olahraga)', async () => {
        const mockData = {
            userProfile: { targetCalories: 2000 },
            dailyLogs: {
                foodLogs: [
                    { porsi: 1, food: { kalori: 1000, protein:0, carbs:0, fat:0 } } // +1000
                ],
                exerciseLogs: [
                    { durationInMinutes: 30, exercise: { caloriesBurnPerMinute: 10 } } // -300 (30*10)
                ]
            },
            allFoods: [], allExercises: []
        };

        RekomendasiModel.getRequiredRecommendationData.mockResolvedValue(mockData);

        await RekomendasiController.getRekomendasi(req, res);

        // Net = 1000 - 300 = 700
        // Remaining = 2000 - 700 = 1300

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            summary: expect.objectContaining({
                consumed: 1000,
                burned: 300,
                currentNet: 700,
                remaining: 1300
            })
        }));
    });

    // SKENARIO 6: SERVER ERROR 
    test('Return 500 jika terjadi error di model', async () => {
        RekomendasiModel.getRequiredRecommendationData.mockRejectedValue(new Error("DB Error"));

        await RekomendasiController.getRekomendasi(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Gagal memproses data rekomendasi." });
    });
});
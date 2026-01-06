import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/user.model.js', () => ({
    updateUserCalculations: jest.fn(),
    findUserById: jest.fn(),
}));

const UserController = await import('../src/controllers/user.controller.js');
const UserModel = await import('../src/models/user.model.js');

describe('User Controller Unit Testing', () => {
    let req, res;

    beforeEach(() => {
        req = { 
            user: { userId: 'user-123' },
            body: {}, 
            params: {} 
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // --- CALCULATE CALORIE ---
    describe('calculateCalorie', () => {
        test('Success calculating calories (200)', async () => {
            req.body = { 
                gender: 'MALE', 
                age: 25, 
                height: 175, 
                weight: 70, 
                goal: 'CUTTING' 
            };

            const mockUpdatedUser = {
                targetCalories: 2000,
                targetProtein: 140,
                targetCarbs: 200,
                targetFat: 70
            };

            UserModel.updateUserCalculations.mockResolvedValue(mockUpdatedUser);

            await UserController.calculateCalorie(req, res);

            expect(UserModel.updateUserCalculations).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Kalkulasi kalori berhasil disimpan!",
                data: mockUpdatedUser
            }));
        });

        test('Fail - Missing fields (400)', async () => {
            req.body = { gender: 'MALE' }; // Incomplete data
            await UserController.calculateCalorie(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: expect.stringContaining("wajib diisi") 
            }));
        });

        test('Fail - Invalid data types (400)', async () => {
            req.body = { 
                gender: 'MALE', 
                age: 'not-number', // Invalid
                height: 175, 
                weight: 70, 
                goal: 'CUTTING' 
            };
            await UserController.calculateCalorie(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
             expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: expect.stringContaining("harus berupa angka") 
            }));
        });
        
        test('Fail - Server Error (500)', async () => {
             req.body = { 
                gender: 'MALE', 
                age: 25, 
                height: 175, 
                weight: 70, 
                goal: 'CUTTING' 
            };
            UserModel.updateUserCalculations.mockRejectedValue(new Error("DB Error"));
            await UserController.calculateCalorie(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --- GET USER PROFILE ---
    describe('getUserProfile', () => {
        test('Success fetching profile (200)', async () => {
            const mockUser = { id: 'user-123', username: 'testuser' };
            UserModel.findUserById.mockResolvedValue(mockUser);

            await UserController.getUserProfile(req, res);

            expect(UserModel.findUserById).toHaveBeenCalledWith('user-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ data: mockUser });
        });

        test('Fail - User not found (404)', async () => {
            UserModel.findUserById.mockResolvedValue(null);
            await UserController.getUserProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
        
        test('Fail - Server Error (500)', async () => {
            UserModel.findUserById.mockRejectedValue(new Error("DB Error"));
            await UserController.getUserProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --- GET USER STATS ---
    describe('getUserStats', () => {
        test('Success fetching stats for logged in user (200)', async () => {
            const today = new Date();
            const mockUser = { 
                streak: 5, 
                lastLogDate: today, 
                username: 'testuser', 
                nama: 'Test User' 
            };
            
            UserModel.findUserById.mockResolvedValue(mockUser);

            await UserController.getUserStats(req, res);

            expect(UserModel.findUserById).toHaveBeenCalledWith('user-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                streak: 5,
                isStreakActive: true, // Should be true since lastLogDate is today
                username: 'testuser'
            }));
        });
        
         test('Success fetching stats with broken streak (200)', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 2); // 2 days ago

            const mockUser = { 
                streak: 5, 
                lastLogDate: yesterday, 
                username: 'testuser', 
                nama: 'Test User' 
            };
            
            UserModel.findUserById.mockResolvedValue(mockUser);

            await UserController.getUserStats(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
             expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                isStreakActive: false, 
            }));
        });

        test('Fail - User ID missing (400)', async () => {
            req.user = {}; // No userId in req.user
            req.params = {};
            
            await UserController.getUserStats(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('Fail - User not found (404)', async () => {
            UserModel.findUserById.mockResolvedValue(null);
            await UserController.getUserStats(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
import { jest } from '@jest/globals';

jest.unstable_mockModule('nodemailer', () => ({
    default: {
        createTransport: jest.fn().mockReturnValue({
            sendMail: jest.fn().mockResolvedValue(true)
        })
    }
}));

jest.unstable_mockModule('crypto', () => ({
    default: {
        randomBytes: jest.fn().mockReturnValue({
            toString: jest.fn().mockReturnValue('mock-hex-token')
        })
    }
}));

jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        hash: jest.fn(),
        compare: jest.fn(),
        genSalt: jest.fn()
    }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: jest.fn()
    }
}));

jest.unstable_mockModule('../src/models/user.model.js', () => ({
    findUserByEmailOrUsername: jest.fn(),
    createUser: jest.fn(),
    findUserByEmailandUsername: jest.fn(),
    findUserByValidToken: jest.fn(),
    updatePasswordReset: jest.fn(),
    findUserByEmail: jest.fn(),
    saveResetToken: jest.fn()
}));


const { register, login, resetPassword } = await import('../src/controllers/auth.controller.js');
const UserModel = await import('../src/models/user.model.js');
const bcrypt = (await import('bcryptjs')).default;
const jwt = (await import('jsonwebtoken')).default;


describe('Auth Controller Unit Testing', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // TEST REGISTER 
    describe('register', () => {
        test('Harus return 201 dan userId jika registrasi berhasil', async () => {
            req.body = { email: 'test@mail.com', username: 'testuser', password: 'password123' };

            UserModel.findUserByEmailOrUsername.mockResolvedValue(null);
            UserModel.createUser.mockResolvedValue({ id: 'user-123' });

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Registrasi berhasil!",
                userId: 'user-123'
            });
        });

        test('Harus return 400 jika email/username sudah terdaftar', async () => {
            req.body = { email: 'exist@mail.com', username: 'existuser' };

            UserModel.findUserByEmailOrUsername.mockResolvedValue({ id: 'existing-id' });

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Email atau username sudah terdaftar." 
            });
        });
    });

    // TEST LOGIN 
    describe('login', () => {
        test('Harus return 200 dan Token jika login sukses', async () => {
            req.body = { email: 'test@mail.com', password: 'password123' };

            const mockUser = {
                id: 'user-123',
                email: 'test@mail.com',
                username: 'testuser',
                password: 'hashedpassword',
                role: 'PENGGUNA_UMUM',
                nama: 'Test User'
            };

            UserModel.findUserByEmailandUsername.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('fake-jwt-token');

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Login berhasil!",
                token: 'fake-jwt-token',
                userId: 'user-123',
                nama: 'Test User',
                role: 'PENGGUNA_UMUM',
                username: 'testuser'
            });
        });

        test('Harus return 401 jika password salah', async () => {
            req.body = { email: 'test@mail.com', password: 'wrongpass' };
            
            UserModel.findUserByEmailandUsername.mockResolvedValue({ password: 'hashedpassword' });
            bcrypt.compare.mockResolvedValue(false);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Kredensial tidak valid." });
        });
    });

    // TEST RESET PASSWORD 
    describe('resetPassword', () => {
        test('Harus return 200 jika reset password berhasil', async () => {
            req.params = { token: 'valid-token' };
            req.body = { newPassword: 'NewPass123' };

            UserModel.findUserByValidToken.mockResolvedValue({ id: 'user-123' });
            bcrypt.hash.mockResolvedValue('new-hashed-pass');
            UserModel.updatePasswordReset.mockResolvedValue(true);

            await resetPassword(req, res);

            expect(UserModel.findUserByValidToken).toHaveBeenCalledWith('valid-token');
            expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123', 10);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Password berhasil direset. Silakan login." 
            });
        });

        test('Harus return 400 jika Token tidak valid', async () => {
            req.params = { token: 'invalid-token' };
            req.body = { newPassword: '123' };

            UserModel.findUserByValidToken.mockResolvedValue(null);

            await resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Token reset password tidak valid atau telah kedaluwarsa." 
            });
        });
    });
});
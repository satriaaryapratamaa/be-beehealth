import { jest } from '@jest/globals';

jest.unstable_mockModule('fs', () => ({
    default: {
        existsSync: jest.fn(),
        unlinkSync: jest.fn()
    }
}));


jest.unstable_mockModule('../src/models/post.model.js', () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
    toggleLike: jest.fn(),
    createComment: jest.fn()
}));

const mockPrisma = {
    post: { findUnique: jest.fn() }
};

jest.unstable_mockModule('../src/lib/prisma.js', () => ({
    prisma: mockPrisma
}));

const PostController = await import('../src/controllers/post.controller.js');
const PostModel = await import('../src/models/post.model.js');
const fs = (await import('fs')).default;
const { prisma } = await import('../src/lib/prisma.js');

describe('Post Controller Unit Testing', () => {
    let req, res;

    beforeEach(() => {
        req = { 
            body: {}, 
            params: {}, 
            user: { userId: 'user-123', role: 'PENGGUNA_UMUM' }, // Default User
            file: null // Default tidak ada file
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // CREATE POST 
    describe('createPost', () => {
        test('Sukses membuat post tanpa gambar (201)', async () => {
            req.body = { deskripsi: 'Halo dunia' };
            PostModel.create.mockResolvedValue({ id: 1, deskripsi: 'Halo dunia', imageUrl: null });

            await PostController.createPost(req, res);

            expect(PostModel.create).toHaveBeenCalledWith('user-123', 'Halo dunia', null);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('Sukses membuat post DENGAN gambar (201)', async () => {
            req.body = { deskripsi: 'Foto liburan' };
            req.file = { path: 'uploads\\images\\foto.jpg' }; 
            
            PostModel.create.mockResolvedValue({ id: 1 });

            await PostController.createPost(req, res);

            expect(PostModel.create).toHaveBeenCalledWith('user-123', 'Foto liburan', 'uploads/images/foto.jpg');
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('Gagal - Deskripsi kosong (400)', async () => {
            req.body = { deskripsi: '' };
            await PostController.createPost(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // GET ALL POSTS 
    describe('getAllPosts', () => {
        test('Sukses mengambil semua post (200)', async () => {
            PostModel.findAll.mockResolvedValue([]);
            await PostController.getAllPosts(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // DELETE POST 
    describe('deletePost', () => {
        test('Sukses menghapus post milik sendiri (200)', async () => {
            req.params.id = 'post-1';
            prisma.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-123', imageUrl: null });
            PostModel.remove.mockResolvedValue(true);

            await PostController.deletePost(req, res);

            expect(PostModel.remove).toHaveBeenCalledWith('post-1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Sukses menghapus post orang lain jika ADMIN (200)', async () => {
            req.params.id = 'post-1';
            req.user.role = 'ADMIN'; 
            
            prisma.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-lain', imageUrl: null });

            await PostController.deletePost(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Sukses menghapus post berserta GAMBAR-nya (200)', async () => {
            req.params.id = 'post-with-img';
            const mockImgPath = 'uploads/foto.jpg';
            
            prisma.post.findUnique.mockResolvedValue({ 
                id: 'post-with-img', 
                userId: 'user-123', 
                imageUrl: mockImgPath 
            });

            fs.existsSync.mockReturnValue(true);

            await PostController.deletePost(req, res);

            expect(fs.existsSync).toHaveBeenCalledWith(mockImgPath);
            expect(fs.unlinkSync).toHaveBeenCalledWith(mockImgPath);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Gagal - Post tidak ditemukan (404)', async () => {
            req.params.id = 'post-gaib';
            prisma.post.findUnique.mockResolvedValue(null);

            await PostController.deletePost(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('Gagal - Bukan pemilik dan bukan ADMIN (403)', async () => {
            req.params.id = 'post-1';
            req.user.userId = 'user-maling';
            req.user.role = 'PENGGUNA_UMUM';

            // Post milik 'user-asli'
            prisma.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-asli' });

            await PostController.deletePost(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    // LIKE POST 
    describe('likePost', () => {
        test('Sukses like/unlike post (200)', async () => {
            req.params.id = 'post-1';
            PostModel.toggleLike.mockResolvedValue({ action: 'liked' });

            await PostController.likePost(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('liked') }));
        });
    });

    // COMMENT ON POST 
    describe('commentOnPost', () => {
        test('Sukses menambah komentar (201)', async () => {
            req.params.id = 'post-1';
            req.body = { text: 'Keren bang' };
            
            PostModel.createComment.mockResolvedValue({ id: 1 });

            await PostController.commentOnPost(req, res);

            expect(PostModel.createComment).toHaveBeenCalledWith('user-123', 'post-1', 'Keren bang');
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('Gagal - Komentar kosong (400)', async () => {
            req.body = { text: '' };
            await PostController.commentOnPost(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
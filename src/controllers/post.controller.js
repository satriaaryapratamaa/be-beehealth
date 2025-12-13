import * as PostModel from '../models/post.model.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';

export const createPost = async (req, res) => {
    const userId = req.user.userId;
    const { deskripsi} = req.body;

    let imagePath = null;

    if (req.file) {
        imagePath = req.file.path.replace(/\\/g, '/');
    }

    if (!deskripsi) {
        if (imagePath && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: "Deskripsi wajib diisi." });
    }

    try {
        const post = await PostModel.create(userId, deskripsi, imagePath);
        res.status(201).json({ message: 'Post berhasil dibuat', data: post });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat post', error: error.message });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const posts = await PostModel.findAll();
        res.status(200).json({ data: posts });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil posts', error: error.message });
    }
};

export const deletePost = async (req, res) => {
    const userId = req.user.userId;
    const role = req.user.role;
    const { id } = req.params;

    try {
        const post = await prisma.post.findUnique({ where: { id: id } });
        if (!post) {
            return res.status(404).json({ message: 'Post tidak ditemukan.' });
        }

        if (post.userId !== userId && role !== 'ADMIN') {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk menghapus post ini.' });
        }
        
        if (post.imageUrl) {
            if (fs.existsSync(post.imagePath)) {
                fs.unlinkSync(post.imagePath);
                console.log(`File berhasil dihapus: ${post.imagePath}`);
            }
        }

        await PostModel.remove(id);
        res.status(200).json({ message: 'Post berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus post', error: error.message });
    }
};

export const likePost = async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params; // ID postingan

    try {
        const result = await PostModel.toggleLike(userId, id);
        
        res.status(200).json({ 
            message: `Post berhasil di-${result.action}!`, 
            data: result 
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memproses like', error: error.message });
    }
};

export const commentOnPost = async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: "Komentar tidak boleh kosong." });
    }

    try {
        const comment = await PostModel.createComment(userId, id, text);
        res.status(201).json({ message: 'Komentar berhasil ditambahkan', data: comment });
    } catch (error) {
        res.status(500).json({ message: 'server error', error: error.message });
    }
};

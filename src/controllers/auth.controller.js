import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/user.model.js';

export const register = async (req, res) => {
    const { email, username } = req.body;

    try {
        const existingUser = await UserModel.findUserByEmailOrUsername(email, username);
        if (existingUser) {
        return res.status(400).json({ message: "Email atau username sudah terdaftar." });
        }
            const newUser = await UserModel.createUser(req.body);
            res.status(201).json({
            message: "Registrasi berhasil!",
            userId: newUser.id,
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const user = await UserModel.findUserByEmailOrUsername(email,username);

        if (!user) {
        return res.status(401).json({ message: "Email atau password salah." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Email atau password salah." });
        }
        
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        );

        res.status(200).json({
            message: "Login berhasil!",
            token: token,
            userId: user.id,
            nama: user.nama,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};
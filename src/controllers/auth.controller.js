import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UserModel from '../models/user.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
        const user = await UserModel.findUserByEmailandUsername(email,username);
        
        if (!user) {
            return res.status(401).json({ message: "Kredensial tidak valid." });
        };

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Kredensial tidak valid." });
        };
        
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '720h' }
        );

        res.status(200).json({
            message: "Login berhasil!",
            token: token,
            userId: user.id,
            nama: user.nama,
            role: user.role,
            username: user.username,
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ message: "User dengan email tersebut tidak ditemukan." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 jam

        await UserModel.saveResetToken(email, resetToken, resetTokenExpiry);

        console.log("Mencoba mengirim email dengan user:", process.env.EMAIL_USER);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetLink = `'https://tubesimpalbeehealth.netlify.app/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: '"BeeHealth Support" <no-reply@beehealth.com>',
            to: email,
            subject: 'Reset Password BeeHealth',
            html: `
                <h3>Permintaan Reset Password</h3>
                <p>Klik tautan berikut untuk membuat password baru:</p>
                <a href="${resetLink}" style="background-color: #FCD34D; padding: 10px 20px; color: black; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                <p>Atau copy link ini: ${resetLink}</p>
                <p>Link ini berlaku selama 1 jam.</p>
            `,
        });

        res.status(200).json({ message: "Tautan reset password telah dikirim ke email Anda." });
    } catch (error) {
        console.error("Error forgotPassword:", error);
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params; 
        const { newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({message: "Token dan password baru wajib diisi."});
        }

        const user = await UserModel.findUserByValidToken(token);

        if (!user) {
            return res.status(400).json({ message: "Token reset password tidak valid atau telah kedaluwarsa." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserModel.updatePasswordReset(user.id, hashedPassword)

        res.status(200).json({ message: "Password berhasil direset. Silakan login." });

    } catch (error) {
        console.error("Error resetPassword:", error);
        res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
    }
};
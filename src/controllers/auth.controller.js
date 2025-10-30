// src/controllers/auth.controller.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
// Impor model baru kita
import * as UserModel from '../models/user.model.js';

export const register = async (req, res) => {
  const { email, username } = req.body;

  try {
    // 1. Panggil Model
    const existingUser = await UserModel.findUserByEmailOrUsername(email, username);

    if (existingUser) {
      return res.status(400).json({ message: "Email atau username sudah terdaftar." });
    }

    // 2. Panggil Model
    // Kita kirim 'req.body' langsung ke model
    const newUser = await UserModel.createUser(req.body);

    res.status(201).json({
      message: "Registrasi berhasil!",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("!!! SERVER CRASH SAAT REGISTRASI:", error);
    res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Panggil Model
    const user = await UserModel.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    // 2. Validasi password (tetap di controller)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    // 3. Buat Token (logika bisnis, tetap di controller)
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
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
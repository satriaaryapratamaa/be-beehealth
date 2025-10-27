// src/middleware/auth.middleware.js

import jwt from 'jsonwebtoken';

// Fungsi ini sudah ada
export const protect = (req, res, next) => {
  // ... (isi fungsi protect sama seperti sebelumnya)
  // ...
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // req.user = { userId: '...', role: '...' }
            next();
        } catch (error) {
        res.status(401).json({ message: 'Token tidak valid, otorisasi ditolak.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Tidak ada token, otorisasi ditolak.' });
    }
};

// --- TAMBAHKAN FUNGSI INI ---
// Middleware ini harus dijalankan SETELAH 'protect'
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Akses ditolak. Rute ini hanya untuk Admin.' });
    }
};
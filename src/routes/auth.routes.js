// src/routes/auth.routes.js

import express from 'express';
// Import semua 'export' dari controller sebagai satu objek
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// Panggil fungsinya sebagai 'authController.register'
router.post('/register', authController.register);

// Panggil fungsinya sebagai 'authController.login'
router.post('/login', authController.login);

export default router;
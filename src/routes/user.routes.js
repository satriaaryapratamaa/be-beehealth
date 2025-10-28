import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// [POST] /api/user/calculate
// Endpoint untuk user submit form kalkulasi kalori
// 'protect' memastikan hanya user yg sudah login (punya token) yg bisa
router.post('/calculate', protect, userController.calculateCalorie);

// [GET] /api/user/profile
// Endpoint untuk mengambil data profil user yang sedang login
router.get('/profile', protect, userController.getUserProfile);


export default router;
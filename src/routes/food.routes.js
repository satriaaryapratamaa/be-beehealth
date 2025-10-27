// src/routes/food.routes.js

import express from 'express';
// Import semua controller sebagai satu objek
import * as foodController from '../controllers/food.controller.js';
// Import middleware kita
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- Rute untuk ADMIN (CRUD Penuh) ---
// Dijalankan berurutan: cek login (protect) -> cek admin (isAdmin) -> baru jalankan controller
router.post('/', protect, isAdmin, foodController.createFood);
router.put('/:id', protect, isAdmin, foodController.updateFood);
router.delete('/:id', protect, isAdmin, foodController.deleteFood);


// --- Rute untuk SEMUA USER (Hanya Baca) ---
// Hanya perlu login (protect)
router.get('/', protect, foodController.getAllFood);
router.get('/:id', protect, foodController.getFoodById);


export default router;
// src/routes/exercise.routes.js

import express from 'express';
import * as exerciseController from '../controllers/exercise.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- Admin Routes ---
router.post('/', protect, isAdmin, exerciseController.createExercise);
router.put('/:id', protect, isAdmin, exerciseController.updateExercise);
router.delete('/:id', protect, isAdmin, exerciseController.deleteExercise);

// --- User Routes (Hanya baca, untuk memilih saat logging) ---
router.get('/', protect, exerciseController.getAllExercises);
router.get('/:id', protect, exerciseController.getExerciseById);

export default router;
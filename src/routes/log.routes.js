// import express from 'express'
// import * as logController from '../controllers/log.controller.js';
// import { protect } from '../middleware/auth.middleware.js';

// const router = express.Router();

// router.post('/food', protect, logController.logFood);
// router.post('/exercise', protect, logController.logExercise);
// router.get('/daily', protect, logController.getDailyLogs);

// router.delete('/food/:id', protect, logController.deleteFoodLog);
// router.delete('/exercise/:id', protect, logController.deleteExerciseLog);

// export default router;

import express from 'express';
// PERBAIKAN DI SINI:
// Gunakan kurung kurawal { } karena di controller kita pakai 'export const'
import { 
    logFood, 
    logExercise, 
    getDailyLogs, 
    deleteFoodLog, 
    deleteExerciseLog 
} from '../controllers/log.controller.js';

import { protect } from '../middleware/auth.middleware.js'; // Pastikan path middleware benar

const router = express.Router();

// --- Routes POST (Catat) ---
router.post('/food', protect, logFood);
router.post('/exercise', protect, logExercise);

// --- Route GET (Lihat) ---
router.get('/daily', protect, getDailyLogs);

// --- Routes DELETE (Hapus) ---
// Pastikan fungsi deleteFoodLog dan deleteExerciseLog sudah ada di controller
router.delete('/food/:id', protect, deleteFoodLog);
router.delete('/exercise/:id', protect, deleteExerciseLog);

export default router;
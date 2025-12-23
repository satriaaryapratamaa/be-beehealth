import express from 'express'
import * as logController from '../controllers/log.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/food', protect, logController.logFood);
router.post('/exercise', protect, logController.logExercise);
router.get('/daily', protect, logController.getDailyLogs);

router.delete('/food/:id', protect, logController.deleteFoodLog);
router.delete('/exercise/:id', protect, logController.deleteExerciseLog);

export default router;
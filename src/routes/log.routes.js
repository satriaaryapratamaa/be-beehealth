import express from 'express'
import * as logController from '../controllers/log.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/food', protect, logController.LogFood);
router.post('/exercise', protect, logController.LogExercise);
router.get('/daily', protect, logController.GetDailyLogs);

export default router;
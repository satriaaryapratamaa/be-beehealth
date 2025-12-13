import express from 'express';
import * as rekomendasiController from '../controllers/rekomendasi.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, rekomendasiController.getRecommendation);

export default router;
import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/calculate', protect, userController.calculateCalorie);
router.get('/profile', protect, userController.getUserProfile);


export default router;
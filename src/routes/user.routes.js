import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/calculate', protect, userController.calculateCalorie);
router.get('/profile', protect, userController.getUserProfile);
router.get('/stats', protect, userController.getUserStats);
router.get('/stats/:id', protect, userController.getUserStats);


export default router;
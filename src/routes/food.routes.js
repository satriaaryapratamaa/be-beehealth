import express from 'express';
import * as foodController from '../controllers/food.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, isAdmin, foodController.createFood);
router.put('/:id', protect, isAdmin, foodController.updateFood);
router.delete('/:id', protect, isAdmin, foodController.deleteFood);

router.get('/', protect, foodController.getAllFood);
router.get('/:id', protect, foodController.getFoodById);

export default router;
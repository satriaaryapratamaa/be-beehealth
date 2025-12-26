import express from 'express';
// PENTING: Pakai { } karena di controller kita pakai "export const" (Named Export)
import { getRekomendasi } from '../controllers/rekomendasi.controller.js'; 
import { protect } from '../middleware/auth.middleware.js'; // Sesuaikan middleware auth kamu

const router = express.Router();

// Pastikan 'getRekomendasi' berwarna cerah (terbaca/defined)
router.get('/', protect, getRekomendasi); 

export default router;
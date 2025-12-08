import express from "express";
import * as postController from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { uploadMiddleware } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);
router.get('/', postController.getAllPosts);     

router.post('/', uploadMiddleware, postController.createPost);    
router.delete('/:id', postController.deletePost); 

router.post('/:id/like', postController.likePost);         
router.post('/:id/comment', postController.commentOnPost); 

export default router;
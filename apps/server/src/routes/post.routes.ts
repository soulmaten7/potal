import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { authMiddleware, optionalAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import * as likeService from '../services/like.service';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.post('/', authMiddleware, upload.array('images', 10), postController.createPost);
router.get('/:postId', optionalAuth, postController.getPost);
router.delete('/:postId', authMiddleware, postController.deletePost);

router.post('/:postId/like', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try { await likeService.likePost(req.user!.userId, req.params.postId); res.json({ success: true, data: null }); } catch (e) { next(e); }
});
router.delete('/:postId/like', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try { await likeService.unlikePost(req.user!.userId, req.params.postId); res.json({ success: true, data: null }); } catch (e) { next(e); }
});

export default router;

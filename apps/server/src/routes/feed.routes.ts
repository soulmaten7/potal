import { Router } from 'express';
import * as feedController from '../controllers/feed.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/following', authMiddleware, feedController.getFollowingFeed);
router.get('/local', feedController.getLocalFeed);
router.get('/search', feedController.search);

export default router;

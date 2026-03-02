import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/auctions/:auctionId/reviews', authMiddleware, reviewController.createReview);
router.get('/users/:username/reviews', reviewController.getUserReviews);

export default router;

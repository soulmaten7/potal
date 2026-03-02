import { Router } from 'express';
import * as auctionController from '../controllers/auction.controller';
import { authMiddleware, optionalAuth } from '../middlewares/auth.middleware';
import { requireTier } from '../middlewares/tierCheck.middleware';
import { upload } from '../middlewares/upload.middleware';
import * as likeService from '../services/like.service';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.post('/', authMiddleware, requireTier('LEVEL_2'), upload.array('images', 10), auctionController.createAuction);
router.get('/:auctionId', optionalAuth, auctionController.getAuction);
router.post('/:auctionId/bid', authMiddleware, requireTier('LEVEL_2'), auctionController.placeBid);
router.delete('/:auctionId', authMiddleware, auctionController.cancelAuction);
router.post('/:auctionId/complete', authMiddleware, auctionController.completeMeeting);

router.post('/:auctionId/like', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try { await likeService.likeAuction(req.user!.userId, req.params.auctionId); res.json({ success: true, data: null }); } catch (e) { next(e); }
});
router.delete('/:auctionId/like', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try { await likeService.unlikeAuction(req.user!.userId, req.params.auctionId); res.json({ success: true, data: null }); } catch (e) { next(e); }
});

export default router;

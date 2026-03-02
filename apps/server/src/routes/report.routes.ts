import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import prisma from '../config/database';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.report.create({
      data: { reporterId: req.user!.userId, reportedUserId: req.body.reportedUserId, reason: req.body.reason, description: req.body.description, relatedAuctionId: req.body.relatedAuctionId, relatedPostId: req.body.relatedPostId },
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) { next(error); }
});

export default router;

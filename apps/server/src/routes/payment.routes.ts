import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import prisma from '../config/database';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch (error) { next(error); }
});

export default router;

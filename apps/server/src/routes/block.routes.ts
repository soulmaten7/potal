import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import prisma from '../config/database';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler.middleware';

const router = Router();

router.post('/:username/block', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!target) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');
    await prisma.block.create({ data: { blockerId: req.user!.userId, blockedId: target.id } });
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
});

router.delete('/:username/block', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const target = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!target) throw new AppError(404, 'USER_NOT_FOUND', '사용자를 찾을 수 없습니다');
    await prisma.block.deleteMany({ where: { blockerId: req.user!.userId, blockedId: target.id } });
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
});

export default router;

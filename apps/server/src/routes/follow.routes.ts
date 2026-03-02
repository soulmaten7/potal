import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as followService from '../services/follow.service';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.post('/:username/follow', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await followService.followUser(req.user!.userId, req.params.username);
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
});

router.delete('/:username/follow', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await followService.unfollowUser(req.user!.userId, req.params.username);
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
});

router.get('/:username/followers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await followService.getFollowers(req.params.username, req.query.cursor as string);
    res.json({ success: true, data: result.followers, pagination: { cursor: result.cursor, hasMore: result.hasMore } });
  } catch (error) { next(error); }
});

router.get('/:username/following', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await followService.getFollowing(req.params.username, req.query.cursor as string);
    res.json({ success: true, data: result.following, pagination: { cursor: result.cursor, hasMore: result.hasMore } });
  } catch (error) { next(error); }
});

export default router;

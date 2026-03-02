import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';

export function requireTier(minTier: 'LEVEL_1' | 'LEVEL_2') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) { next(new AppError(401, 'UNAUTHORIZED', '로그인이 필요합니다')); return; }
    if (minTier === 'LEVEL_2' && req.user.tier !== 'LEVEL_2') {
      next(new AppError(403, 'INSUFFICIENT_TIER', 'Lv.2 인증이 필요합니다'));
      return;
    }
    next();
  };
}

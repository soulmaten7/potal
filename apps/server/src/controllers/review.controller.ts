import { Request, Response, NextFunction } from 'express';
import * as reviewService from '../services/review.service';

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.createReview(req.params.auctionId, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) { next(error); }
}

export async function getUserReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { cursor, limit } = req.query;
    const result = await reviewService.getUserReviews(req.params.username, cursor as string, Number(limit) || 20);
    res.json({ success: true, data: result.reviews, pagination: { cursor: result.cursor, hasMore: result.hasMore } });
  } catch (error) { next(error); }
}

import { Request, Response, NextFunction } from 'express';
import * as feedService from '../services/feed.service';

export async function getFollowingFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { cursor, limit } = req.query;
    const result = await feedService.getFollowingFeed(req.user!.userId, cursor as string, Number(limit) || 20);
    res.json({ success: true, data: result.items, pagination: { cursor: result.cursor, hasMore: result.hasMore } });
  } catch (error) { next(error); }
}

export async function getLocalFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const { city, cursor, limit, sort } = req.query;
    const result = await feedService.getLocalFeed(city as string || '서울', cursor as string, Number(limit) || 20, sort as string);
    res.json({ success: true, data: result.auctions, pagination: { cursor: result.cursor, hasMore: result.hasMore } });
  } catch (error) { next(error); }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, type, limit } = req.query;
    const result = await feedService.searchFeed(q as string || '', type as string, Number(limit) || 20);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

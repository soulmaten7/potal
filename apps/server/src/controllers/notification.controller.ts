import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const { cursor, limit } = req.query;
    const result = await notificationService.getNotifications(req.user!.userId, cursor as string, Number(limit) || 20);
    res.json({ success: true, data: result.notifications, pagination: { cursor: result.cursor, hasMore: result.hasMore } });
  } catch (error) { next(error); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllRead(req.user!.userId);
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
}

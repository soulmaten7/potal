import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';

export async function getRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const rooms = await chatService.getChatRooms(req.user!.userId);
    res.json({ success: true, data: rooms });
  } catch (error) { next(error); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { cursor, limit } = req.query;
    const result = await chatService.getChatMessages(req.params.roomId, req.user!.userId, cursor as string, Number(limit) || 50);
    res.json({ success: true, data: result.messages, pagination: { cursor: result.cursor, hasMore: result.hasMore } });
  } catch (error) { next(error); }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const message = await chatService.sendMessage(req.params.roomId, req.user!.userId, req.body.content, req.body.imageUrl);
    res.status(201).json({ success: true, data: message });
  } catch (error) { next(error); }
}

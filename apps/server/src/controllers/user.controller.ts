import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import * as postService from '../services/post.service';
import { getImageUrl } from '../services/upload.service';

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUserByUsername(req.params.username, req.user?.userId);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
}

export async function updateProfileImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: '이미지를 선택하세요' } }); return; }
    const imageUrl = getImageUrl(req.file.filename);
    const user = await userService.updateProfileImage(req.user!.userId, imageUrl);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
}

export async function getUserPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { cursor, limit } = req.query;
    const result = await postService.getUserPosts(req.params.username, cursor as string, Number(limit) || 20);
    res.json({ success: true, data: result.posts, pagination: { cursor: result.cursor, hasMore: result.hasMore } });
  } catch (error) { next(error); }
}

import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/post.service';
import { getImageUrl } from '../services/upload.service';

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ success: false, error: { code: 'NO_IMAGES', message: '이미지를 선택하세요' } }); return; }
    const imageUrls = files.map(f => getImageUrl(f.filename));
    const post = await postService.createPost(req.user!.userId, req.body.caption, imageUrls, req.body.locationName);
    res.status(201).json({ success: true, data: post });
  } catch (error) { next(error); }
}

export async function getPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await postService.getPostById(req.params.postId, req.user?.userId);
    res.json({ success: true, data: post });
  } catch (error) { next(error); }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    await postService.deletePost(req.params.postId, req.user!.userId);
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
}

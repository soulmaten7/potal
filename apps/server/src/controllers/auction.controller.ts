import { Request, Response, NextFunction } from 'express';
import * as auctionService from '../services/auction.service';
import * as bidService from '../services/bid.service';
import { getImageUrl } from '../services/upload.service';

export async function createAuction(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    const imageUrls = files ? files.map(f => getImageUrl(f.filename)) : [];
    const auction = await auctionService.createAuction(req.user!.userId, req.body, imageUrls);
    res.status(201).json({ success: true, data: auction });
  } catch (error) { next(error); }
}

export async function getAuction(req: Request, res: Response, next: NextFunction) {
  try {
    const auction = await auctionService.getAuctionById(req.params.auctionId, req.user?.userId);
    res.json({ success: true, data: auction });
  } catch (error) { next(error); }
}

export async function placeBid(req: Request, res: Response, next: NextFunction) {
  try {
    const bid = await bidService.placeBid(req.params.auctionId, req.user!.userId, req.body.amount, req.body.isBuyNow);
    res.status(201).json({ success: true, data: bid });
  } catch (error) { next(error); }
}

export async function cancelAuction(req: Request, res: Response, next: NextFunction) {
  try {
    await auctionService.cancelAuction(req.params.auctionId, req.user!.userId);
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
}

export async function completeMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await auctionService.completeMeeting(req.params.auctionId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

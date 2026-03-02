import { Request, Response, NextFunction } from 'express';
import * as verificationService from '../services/verification.service';

export async function verifyIdCard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await verificationService.verifyIdCard(req.user!.userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

export async function verifyFace(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await verificationService.verifyFace(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await verificationService.getVerificationStatus(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

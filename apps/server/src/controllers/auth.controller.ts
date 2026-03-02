import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, username, displayName } = req.body;
    const result = await authService.signup(email, password, username, displayName);
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.userId);
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
}

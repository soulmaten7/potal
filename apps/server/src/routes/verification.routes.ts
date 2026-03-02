import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/id-card', authMiddleware, verificationController.verifyIdCard);
router.post('/face', authMiddleware, verificationController.verifyFace);
router.get('/status', authMiddleware, verificationController.getStatus);

export default router;

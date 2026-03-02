import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/rooms', authMiddleware, chatController.getRooms);
router.get('/rooms/:roomId/messages', authMiddleware, chatController.getMessages);
router.post('/rooms/:roomId/messages', authMiddleware, chatController.sendMessage);

export default router;

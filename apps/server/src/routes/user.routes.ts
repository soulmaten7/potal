import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware, optionalAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.get('/:username', optionalAuth, userController.getProfile);
router.put('/me', authMiddleware, userController.updateProfile);
router.put('/me/profile-image', authMiddleware, upload.single('image'), userController.updateProfileImage);
router.get('/:username/posts', userController.getUserPosts);

export default router;

// ============================================
// Ale Motos — Auth Routes
// ============================================

import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.get('/profile', authMiddleware, (req, res, next) => authController.getProfile(req, res, next));

export default router;

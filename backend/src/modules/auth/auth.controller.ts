// ============================================
// Ale Motos — Auth Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await authService.getProfile(req.user!.userId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

// ============================================
// Ale Motos — Portal Cliente Routes (PÚBLICO)
// ============================================

import { Router } from 'express';
import { portalClienteController } from './portal-cliente.controller';
import { portalRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Ruta pública con rate limiting — sin autenticación
router.get('/buscar', portalRateLimiter, (req, res, next) => portalClienteController.buscar(req, res, next));

export default router;

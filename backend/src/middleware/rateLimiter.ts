// ============================================
// Ale Motos — Rate Limiter (portal de cliente)
// ============================================

import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const portalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: {
      code: 'DEMASIADAS_SOLICITUDES',
      message: 'Demasiadas solicitudes desde esta IP. Por favor, intente nuevamente en un minuto.',
      details: {},
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// Ale Motos — Middleware de errores centralizado
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn('Error de dominio', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
    });

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Error inesperado
  logger.error('Error inesperado', {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: {
      code: 'ERROR_INTERNO',
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : {},
    },
  });
}

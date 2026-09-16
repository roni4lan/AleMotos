// ============================================
// Ale Motos — Middleware de autenticación JWT
// ============================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { DomainErrors } from '../utils/errors';
import { prisma } from '../utils/prisma';

export interface AuthPayload {
  userId: string;
  email: string;
  rolId: string;
  rolNombre: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw DomainErrors.TOKEN_INVALIDO();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;

    // Verificar que el usuario sigue activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      throw DomainErrors.TOKEN_INVALIDO();
    }

    req.user = {
      userId: usuario.id,
      email: usuario.email,
      rolId: usuario.rol.id,
      rolNombre: usuario.rol.nombre,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(DomainErrors.TOKEN_INVALIDO());
    } else {
      next(error);
    }
  }
}

// ============================================
// Ale Motos — Auth Service
// ============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { prisma } from '../../utils/prisma';
import { DomainErrors } from '../../utils/errors';
import { AuthPayload } from '../../middleware/auth';

export class AuthService {
  async login(email: string, password: string): Promise<{ token: string; user: AuthPayload }> {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      throw DomainErrors.CREDENCIALES_INVALIDAS();
    }

    const passwordValid = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValid) {
      throw DomainErrors.CREDENCIALES_INVALIDAS();
    }

    const payload: AuthPayload = {
      userId: usuario.id,
      email: usuario.email,
      rolId: usuario.rol.id,
      rolNombre: usuario.rol.nombre,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return { token, user: payload };
  }

  async getProfile(userId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true },
    });

    if (!usuario) {
      throw DomainErrors.TOKEN_INVALIDO();
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol.nombre,
      activo: usuario.activo,
    };
  }
}

export const authService = new AuthService();

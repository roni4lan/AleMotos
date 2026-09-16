// ============================================
// Ale Motos — Proveedores Service
// ============================================

import { prisma } from '../../utils/prisma';
import { DomainErrors } from '../../utils/errors';

export interface CreateProveedorDTO {
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export class ProveedoresService {
  async listar(search?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { contacto: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        include: { _count: { select: { productos: true } } },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      prisma.proveedor.count({ where }),
    ]);

    return {
      data: proveedores,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async obtener(id: string) {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        productos: {
          where: { activo: true },
          orderBy: { nombre: 'asc' },
        },
      },
    });

    if (!proveedor) throw DomainErrors.PROVEEDOR_NO_ENCONTRADO(id);
    return proveedor;
  }

  async crear(data: CreateProveedorDTO) {
    return prisma.proveedor.create({ data });
  }

  async actualizar(id: string, data: Partial<CreateProveedorDTO>) {
    const proveedor = await prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) throw DomainErrors.PROVEEDOR_NO_ENCONTRADO(id);

    return prisma.proveedor.update({ where: { id }, data });
  }

  async eliminar(id: string) {
    const proveedor = await prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) throw DomainErrors.PROVEEDOR_NO_ENCONTRADO(id);

    await prisma.proveedor.delete({ where: { id } });
    return { message: 'Proveedor eliminado correctamente' };
  }
}

export const proveedoresService = new ProveedoresService();

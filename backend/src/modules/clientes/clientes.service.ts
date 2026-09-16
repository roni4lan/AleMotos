// ============================================
// Ale Motos — Clientes Service
// ============================================

import { prisma } from '../../utils/prisma';
import { DomainErrors } from '../../utils/errors';

export interface CreateClienteDTO {
  dni?: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface CreateMotoDTO {
  clienteId?: string;
  dominio?: string;
  marca: string;
  modelo: string;
  anio?: number;
  kilometrajeActual?: number;
}

export class ClientesService {
  async listar(search?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search } },
        { telefono: { contains: search } },
      ];
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        include: { motos: true, _count: { select: { ventas: true } } },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      prisma.cliente.count({ where }),
    ]);

    return {
      data: clientes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async obtener(id: string) {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        motos: {
          include: {
            reparaciones: {
              orderBy: { fechaIngreso: 'desc' },
              take: 10,
            },
          },
        },
        ventas: {
          orderBy: { fecha: 'desc' },
          take: 10,
          include: {
            items: { include: { producto: { select: { nombre: true, sku: true } } } },
          },
        },
      },
    });

    if (!cliente) throw DomainErrors.CLIENTE_NO_ENCONTRADO(id);
    return cliente;
  }

  async crear(data: CreateClienteDTO) {
    if (data.dni) {
      const existente = await prisma.cliente.findUnique({ where: { dni: data.dni } });
      if (existente) throw DomainErrors.DNI_DUPLICADO(data.dni);
    }

    return prisma.cliente.create({ data, include: { motos: true } });
  }

  async actualizar(id: string, data: Partial<CreateClienteDTO>) {
    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw DomainErrors.CLIENTE_NO_ENCONTRADO(id);

    if (data.dni && data.dni !== cliente.dni) {
      const existente = await prisma.cliente.findUnique({ where: { dni: data.dni } });
      if (existente) throw DomainErrors.DNI_DUPLICADO(data.dni);
    }

    return prisma.cliente.update({
      where: { id },
      data,
      include: { motos: true },
    });
  }

  async eliminar(id: string) {
    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw DomainErrors.CLIENTE_NO_ENCONTRADO(id);
    await prisma.cliente.delete({ where: { id } });
    return { message: 'Cliente eliminado correctamente' };
  }

  // --- Motos ---
  async obtenerModelosMotos() {
    const modelos = await prisma.moto.findMany({
      distinct: ['marca', 'modelo'],
      select: { marca: true, modelo: true },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
    });
    return modelos;
  }

  async agregarMoto(data: CreateMotoDTO) {
    const dominioLimpio = data.dominio?.trim() || null;

    if (data.clienteId) {
      const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId }, include: { motos: true } });
      if (!cliente) throw DomainErrors.CLIENTE_NO_ENCONTRADO(data.clienteId);
      
      const motoExistente = cliente.motos.find(m => 
        (dominioLimpio && m.dominio?.toLowerCase() === dominioLimpio.toLowerCase()) || 
        (!dominioLimpio && m.marca.toLowerCase() === data.marca.toLowerCase() && m.modelo.toLowerCase() === data.modelo.toLowerCase() && !m.dominio)
      );
      
      if (motoExistente) return motoExistente;
    } else {
      // Buscar moto anónima exacta
      const anonExistente = await prisma.moto.findFirst({
        where: {
          clienteId: null,
          marca: { equals: data.marca, mode: 'insensitive' },
          modelo: { equals: data.modelo, mode: 'insensitive' },
          dominio: dominioLimpio
        }
      });
      if (anonExistente) return anonExistente;
    }

    if (dominioLimpio) {
      const existente = await prisma.moto.findUnique({ where: { dominio: dominioLimpio } });
      if (existente) throw DomainErrors.DOMINIO_DUPLICADO(dominioLimpio);
    }

    return prisma.moto.create({ 
      data: {
        ...data,
        dominio: dominioLimpio
      }
    });
  }

  async actualizarMoto(id: string, data: Partial<CreateMotoDTO>) {
    const moto = await prisma.moto.findUnique({ where: { id } });
    if (!moto) throw DomainErrors.MOTO_NO_ENCONTRADA(id);

    if (data.dominio && data.dominio !== moto.dominio) {
      const existente = await prisma.moto.findUnique({ where: { dominio: data.dominio } });
      if (existente) throw DomainErrors.DOMINIO_DUPLICADO(data.dominio);
    }

    return prisma.moto.update({ where: { id }, data });
  }

  async eliminarMoto(id: string) {
    const moto = await prisma.moto.findUnique({ where: { id } });
    if (!moto) throw DomainErrors.MOTO_NO_ENCONTRADA(id);
    await prisma.moto.delete({ where: { id } });
    return { message: 'Moto eliminada correctamente' };
  }
}

export const clientesService = new ClientesService();

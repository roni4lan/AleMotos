// ============================================
// Ale Motos — Ventas Service
// ============================================

import { prisma } from '../../utils/prisma';
import { DomainErrors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { MetodoPago, TipoComprobante } from '@prisma/client';

export interface ItemVentaDTO {
  productoId: string;
  cantidad: number;
  descuento?: number;
}

export interface CreateVentaDTO {
  clienteId?: string;
  uuidLocal: string;
  items: ItemVentaDTO[];
  metodoPago: MetodoPago;
  tipoComprobante?: TipoComprobante;
  descuento?: number;
  estadoSincronizacion?: 'local' | 'sincronizado';
}

export class VentasService {
  async crear(data: CreateVentaDTO, usuarioId: string) {
    const syncLog = logger.withCorrelation(data.uuidLocal, 'ventas');

    // Idempotencia: verificar si ya existe una venta con este uuid_local
    const existente = await prisma.venta.findUnique({
      where: { uuidLocal: data.uuidLocal },
    });

    if (existente) {
      syncLog.warn('Venta duplicada detectada (idempotencia)', { ventaId: existente.id });
      throw DomainErrors.CONFLICTO_SINCRONIZACION(data.uuidLocal);
    }

    // Validar stock de todos los items
    const productIds = data.items.map(i => i.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productIds } },
    });

    const productoMap = new Map(productos.map(p => [p.id, p]));

    for (const item of data.items) {
      const producto = productoMap.get(item.productoId);
      if (!producto) throw DomainErrors.PRODUCTO_NO_ENCONTRADO(item.productoId);

      const disponible = producto.stockActual - producto.stockReservado;
      if (disponible < item.cantidad) {
        throw DomainErrors.STOCK_INSUFICIENTE(producto.nombre, disponible, item.cantidad);
      }
    }

    // Calcular total con precios congelados
    let total = 0;
    const itemsConPrecio = data.items.map(item => {
      const producto = productoMap.get(item.productoId)!;
      const subtotal = producto.precioVenta * item.cantidad - (item.descuento || 0);
      total += subtotal;
      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitarioCongelado: producto.precioVenta,
        descuento: item.descuento || 0,
      };
    });

    total -= (data.descuento || 0);

    // Transacción: crear venta + descontar stock + registrar movimientos
    const venta = await prisma.$transaction(async (tx) => {
      // 1. Crear venta con items
      const nuevaVenta = await tx.venta.create({
        data: {
          clienteId: data.clienteId || null,
          usuarioId,
          total,
          descuento: data.descuento || 0,
          metodoPago: data.metodoPago,
          tipoComprobante: data.tipoComprobante || 'remito',
          estadoSincronizacion: data.estadoSincronizacion || 'sincronizado',
          uuidLocal: data.uuidLocal,
          items: {
            create: itemsConPrecio,
          },
        },
        include: {
          items: { include: { producto: { select: { nombre: true, sku: true } } } },
          cliente: true,
        },
      });

      // 2. Descontar stock y registrar movimientos
      for (const item of data.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stockActual: { decrement: item.cantidad } },
        });

        await tx.movimientoStock.create({
          data: {
            productoId: item.productoId,
            tipo: 'salida_venta',
            cantidad: -item.cantidad,
            motivo: `Venta ${nuevaVenta.id}`,
            referenciaId: nuevaVenta.id,
            usuarioId,
          },
        });
      }

      return nuevaVenta;
    });

    syncLog.info('Venta creada exitosamente', { ventaId: venta.id, total });
    return venta;
  }

  async listar(query?: {
    fechaDesde?: Date;
    fechaHasta?: Date;
    clienteId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.fechaDesde || query?.fechaHasta) {
      where.fecha = {};
      if (query.fechaDesde) where.fecha.gte = query.fechaDesde;
      if (query.fechaHasta) where.fecha.lte = query.fechaHasta;
    }

    if (query?.clienteId) {
      where.clienteId = query.clienteId;
    }

    const [ventas, total] = await Promise.all([
      prisma.venta.findMany({
        where,
        include: {
          items: { include: { producto: { select: { nombre: true, sku: true } } } },
          cliente: { select: { nombre: true, dni: true } },
          usuario: { select: { nombre: true } },
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.venta.count({ where }),
    ]);

    return {
      data: ventas,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async obtener(id: string) {
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        items: { include: { producto: true } },
        cliente: true,
        usuario: { select: { nombre: true } },
      },
    });

    if (!venta) throw DomainErrors.VENTA_NO_ENCONTRADA(id);
    return venta;
  }
}

export const ventasService = new VentasService();

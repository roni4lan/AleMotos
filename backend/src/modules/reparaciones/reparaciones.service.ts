// ============================================
// Ale Motos — Reparaciones Service
// ============================================

import { prisma } from '../../utils/prisma';
import { DomainErrors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { EstadoReparacion } from '@prisma/client';

// Mapa de transiciones válidas
const TRANSICIONES_VALIDAS: Record<EstadoReparacion, EstadoReparacion[]> = {
  recibido: ['presupuestado'],
  presupuestado: ['recibido', 'aprobado', 'en_proceso'],
  aprobado: ['en_proceso', 'recibido'],
  en_proceso: ['listo'],
  listo: ['entregado'],
  entregado: [], // Estado final
};

export interface CreateReparacionDTO {
  motoId: string;
  descripcionProblema: string;
  uuidLocal: string;
  estadoSincronizacion?: 'local' | 'sincronizado';
}

export interface RepuestoDTO {
  productoId: string;
  cantidad: number;
}

export interface PresupuestoDTO {
  repuestos: RepuestoDTO[];
  totalManoObra: number;
}

export class ReparacionesService {
  // Validar transición de estado
  private validarTransicion(estadoActual: EstadoReparacion, estadoNuevo: EstadoReparacion): void {
    const permitidos = TRANSICIONES_VALIDAS[estadoActual];
    if (!permitidos.includes(estadoNuevo)) {
      throw DomainErrors.TRANSICION_ESTADO_INVALIDA(estadoActual, estadoNuevo);
    }
  }

  async crear(data: CreateReparacionDTO, usuarioId: string) {
    const syncLog = logger.withCorrelation(data.uuidLocal, 'reparaciones');

    // Idempotencia
    const existente = await prisma.reparacion.findUnique({
      where: { uuidLocal: data.uuidLocal },
    });
    if (existente) {
      syncLog.warn('Reparación duplicada detectada', { reparacionId: existente.id });
      throw DomainErrors.CONFLICTO_SINCRONIZACION(data.uuidLocal);
    }

    // Verificar que la moto existe
    const moto = await prisma.moto.findUnique({ where: { id: data.motoId } });
    if (!moto) throw DomainErrors.MOTO_NO_ENCONTRADA(data.motoId);

    const reparacion = await prisma.$transaction(async (tx) => {
      const rep = await tx.reparacion.create({
        data: {
          motoId: data.motoId,
          usuarioId,
          descripcionProblema: data.descripcionProblema,
          estado: 'recibido',
          uuidLocal: data.uuidLocal,
          estadoSincronizacion: data.estadoSincronizacion || 'sincronizado',
        },
        include: {
          moto: { include: { cliente: true } },
        },
      });

      // Registrar estado inicial en historial
      await tx.estadoHistorial.create({
        data: {
          reparacionId: rep.id,
          estado: 'recibido',
          usuarioId,
        },
      });

      return rep;
    });

    syncLog.info('Reparación creada', { reparacionId: reparacion.id });
    return reparacion;
  }

  async cargarPresupuesto(reparacionId: string, presupuesto: PresupuestoDTO, usuarioId: string) {
    const reparacion = await prisma.reparacion.findUnique({ where: { id: reparacionId } });
    if (!reparacion) throw DomainErrors.REPARACION_NO_ENCONTRADA(reparacionId);

    this.validarTransicion(reparacion.estado, 'presupuestado');

    // Validar productos y reservar stock
    const productIds = presupuesto.repuestos.map(r => r.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productIds } },
    });
    const productoMap = new Map(productos.map(p => [p.id, p]));

    let totalRepuestos = 0;
    for (const rep of presupuesto.repuestos) {
      const producto = productoMap.get(rep.productoId);
      if (!producto) throw DomainErrors.PRODUCTO_NO_ENCONTRADO(rep.productoId);

      const disponible = producto.stockActual - producto.stockReservado;
      if (disponible < rep.cantidad) {
        throw DomainErrors.STOCK_INSUFICIENTE(producto.nombre, disponible, rep.cantidad);
      }
      totalRepuestos += producto.precioVenta * rep.cantidad;
    }

    return prisma.$transaction(async (tx) => {
      // Reservar stock
      for (const rep of presupuesto.repuestos) {
        await tx.producto.update({
          where: { id: rep.productoId },
          data: { stockReservado: { increment: rep.cantidad } },
        });
      }

      // Crear repuestos usados con precio congelado
      for (const rep of presupuesto.repuestos) {
        const producto = productoMap.get(rep.productoId)!;
        await tx.repuestoUsado.create({
          data: {
            reparacionId,
            productoId: rep.productoId,
            cantidad: rep.cantidad,
            precioUnitarioCongelado: producto.precioVenta,
          },
        });
      }

      // Actualizar reparación
      const updated = await tx.reparacion.update({
        where: { id: reparacionId },
        data: {
          estado: 'presupuestado',
          totalRepuestos,
          totalManoObra: presupuesto.totalManoObra,
        },
        include: {
          repuestosUsados: { include: { producto: { select: { nombre: true, sku: true } } } },
          moto: { include: { cliente: true } },
        },
      });

      // Registrar en historial
      await tx.estadoHistorial.create({
        data: {
          reparacionId,
          estado: 'presupuestado',
          usuarioId,
        },
      });

      return updated;
    });
  }

  async cambiarEstado(reparacionId: string, nuevoEstado: EstadoReparacion, usuarioId: string, observaciones?: string) {
    const reparacion = await prisma.reparacion.findUnique({
      where: { id: reparacionId },
      include: { repuestosUsados: true },
    });

    if (!reparacion) throw DomainErrors.REPARACION_NO_ENCONTRADA(reparacionId);
    this.validarTransicion(reparacion.estado, nuevoEstado);

    return prisma.$transaction(async (tx) => {
      // Si se entrega: descontar stock reservado definitivamente
      if (nuevoEstado === 'entregado') {
        for (const rep of reparacion.repuestosUsados) {
          await tx.producto.update({
            where: { id: rep.productoId },
            data: {
              stockActual: { decrement: rep.cantidad },
              stockReservado: { decrement: rep.cantidad },
            },
          });

          await tx.movimientoStock.create({
            data: {
              productoId: rep.productoId,
              tipo: 'salida_reparacion',
              cantidad: -rep.cantidad,
              motivo: `Reparación ${reparacionId} - Entrega`,
              referenciaId: reparacionId,
              usuarioId,
            },
          });
        }
      }

      const updated = await tx.reparacion.update({
        where: { id: reparacionId },
        data: { estado: nuevoEstado },
        include: {
          repuestosUsados: { include: { producto: { select: { nombre: true, sku: true } } } },
          moto: { include: { cliente: true } },
          estadoHistorial: { orderBy: { fechaHora: 'asc' } },
        },
      });

      // Registrar en historial (inmutable)
      await tx.estadoHistorial.create({
        data: {
          reparacionId,
          estado: nuevoEstado,
          usuarioId,
          observaciones,
        },
      });

      return updated;
    });
  }

  async listar(query?: {
    estado?: EstadoReparacion;
    motoId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.estado) where.estado = query.estado;
    if (query?.motoId) where.motoId = query.motoId;
    
    if (query?.fechaInicio || query?.fechaFin) {
      where.fechaIngreso = {};
      if (query.fechaInicio) {
        // Asumimos timezone de Argentina (-03:00) para evitar que cargas de la noche anterior (UTC) se filtren como hoy.
        const start = new Date(`${query.fechaInicio}T00:00:00.000-03:00`);
        where.fechaIngreso.gte = start;
        console.log('FILTRO APLICADO (inicio):', start.toISOString());
      }
      if (query.fechaFin) {
        const end = new Date(`${query.fechaFin}T23:59:59.999-03:00`);
        where.fechaIngreso.lte = end;
        console.log('FILTRO APLICADO (fin):', end.toISOString());
      }
    } else {
        console.log('NO SE RECIBIO FECHA INICIO NI FECHA FIN');
    }

    const [reparaciones, total] = await Promise.all([
      prisma.reparacion.findMany({
        where,
        include: {
          moto: { include: { cliente: { select: { nombre: true, dni: true } } } },
          repuestosUsados: { include: { producto: { select: { nombre: true, sku: true } } } },
          usuario: { select: { nombre: true } },
          estadoHistorial: { orderBy: { fechaHora: 'asc' } },
        },
        orderBy: { fechaIngreso: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reparacion.count({ where }),
    ]);

    return {
      data: reparaciones,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async obtener(id: string) {
    const reparacion = await prisma.reparacion.findUnique({
      where: { id },
      include: {
        moto: { include: { cliente: true } },
        repuestosUsados: { include: { producto: true } },
        usuario: { select: { nombre: true } },
        estadoHistorial: {
          orderBy: { fechaHora: 'asc' },
          include: { usuario: { select: { nombre: true } } },
        },
      },
    });

    if (!reparacion) throw DomainErrors.REPARACION_NO_ENCONTRADA(id);
    return reparacion;
  }
}

export const reparacionesService = new ReparacionesService();

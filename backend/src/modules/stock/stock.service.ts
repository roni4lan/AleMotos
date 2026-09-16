// ============================================
// Ale Motos — Stock Service
// ============================================

import { prisma } from '../../utils/prisma';
import { DomainErrors, AppError } from '../../utils/errors';
import { TipoMovimientoStock } from '@prisma/client';

export interface CreateProductoDTO {
  sku?: string;
  nombre: string;
  categoriaId: string;
  proveedorId?: string;
  precioCosto: number;
  margenPorcentaje?: number;
  precioVenta?: number;
  stockActual?: number;
  stockMinimo?: number;
  modelosCompatibles?: string[];
}

export interface UpdateProductoDTO {
  nombre?: string;
  categoriaId?: string;
  proveedorId?: string;
  precioCosto?: number;
  margenPorcentaje?: number;
  precioVenta?: number;
  stockMinimo?: number;
  modelosCompatibles?: string[];
  activo?: boolean;
}

export interface AjusteStockDTO {
  productoId: string;
  cantidad: number; // Positivo = entrada, negativo = salida
  motivo: string;
  usuarioId: string;
}

export class StockService {
  // Calcular precio sugerido
  calcularPrecioSugerido(costo: number, margen: number): number {
    return Math.round(costo * (1 + margen / 100) * 100) / 100;
  }

  async listarProductos(query?: {
    search?: string;
    categoriaId?: string;
    stockBajo?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { activo: true };

    if (query?.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { modelosCompatibles: { has: query.search } },
      ];
    }

    if (query?.categoriaId) {
      where.categoriaId = query.categoriaId;
    }

    if (query?.stockBajo) {
      where.stockActual = { lte: prisma.producto.fields.stockMinimo };
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: {
          categoria: true,
          proveedor: true,
        },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      prisma.producto.count({ where }),
    ]);

    // Agregar flag de stock bajo
    const productosConAlerta = productos.map(p => ({
      ...p,
      stockBajo: p.stockActual <= p.stockMinimo,
      stockDisponible: p.stockActual - p.stockReservado,
    }));

    return {
      data: productosConAlerta,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async obtenerProducto(id: string) {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: { categoria: true, proveedor: true },
    });

    if (!producto) throw DomainErrors.PRODUCTO_NO_ENCONTRADO(id);

    return {
      ...producto,
      stockBajo: producto.stockActual <= producto.stockMinimo,
      stockDisponible: producto.stockActual - producto.stockReservado,
    };
  }

  async crearProducto(data: CreateProductoDTO) {
    let sku = data.sku;
    if (!sku || sku.trim() === '') {
      sku = `ALE-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }

    // Verificar SKU único
    const existente = await prisma.producto.findUnique({ where: { sku } });
    if (existente) throw DomainErrors.SKU_DUPLICADO(sku);

    // Obtener margen por defecto de la categoría si no se especifica
    let margen = data.margenPorcentaje;
    if (margen === undefined) {
      const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } });
      margen = categoria?.margenSugeridoDefault || 30;
    }

    // Calcular precio sugerido si no se especifica
    const precioVenta = data.precioVenta || this.calcularPrecioSugerido(data.precioCosto, margen);

    return prisma.producto.create({
      data: {
        sku,
        nombre: data.nombre,
        categoriaId: data.categoriaId,
        proveedorId: data.proveedorId,
        precioCosto: data.precioCosto,
        margenPorcentaje: margen,
        precioVenta,
        stockActual: data.stockActual || 0,
        stockMinimo: data.stockMinimo || 0,
        modelosCompatibles: data.modelosCompatibles || [],
      },
      include: { categoria: true, proveedor: true },
    });
  }

  async actualizarProducto(id: string, data: UpdateProductoDTO) {
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) throw DomainErrors.PRODUCTO_NO_ENCONTRADO(id);

    // Recalcular precio sugerido si cambian costo o margen
    let precioVenta = data.precioVenta;
    if ((data.precioCosto !== undefined || data.margenPorcentaje !== undefined) && precioVenta === undefined) {
      const costo = data.precioCosto ?? producto.precioCosto;
      const margen = data.margenPorcentaje ?? producto.margenPorcentaje;
      precioVenta = this.calcularPrecioSugerido(costo, margen);
    }

    return prisma.producto.update({
      where: { id },
      data: {
        ...data,
        precioVenta,
      },
      include: { categoria: true, proveedor: true },
    });
  }

  async eliminarProducto(id: string) {
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) throw DomainErrors.PRODUCTO_NO_ENCONTRADO(id);

    // Soft delete
    return prisma.producto.update({
      where: { id },
      data: { activo: false },
    });
  }

  // --- Movimientos de Stock ---

  async ajustarStock(data: AjusteStockDTO) {
    const producto = await prisma.producto.findUnique({ where: { id: data.productoId } });
    if (!producto) throw DomainErrors.PRODUCTO_NO_ENCONTRADO(data.productoId);

    const nuevoStock = producto.stockActual + data.cantidad;
    if (nuevoStock < 0) {
      throw DomainErrors.STOCK_INSUFICIENTE(producto.nombre, producto.stockActual, Math.abs(data.cantidad));
    }

    const tipo: TipoMovimientoStock = data.cantidad > 0 ? 'entrada' : 'ajuste';

    const [productoActualizado, movimiento] = await prisma.$transaction([
      prisma.producto.update({
        where: { id: data.productoId },
        data: { stockActual: nuevoStock },
      }),
      prisma.movimientoStock.create({
        data: {
          productoId: data.productoId,
          tipo,
          cantidad: data.cantidad,
          motivo: data.motivo,
          usuarioId: data.usuarioId,
        },
      }),
    ]);

    return { producto: productoActualizado, movimiento };
  }

  async obtenerMovimientos(productoId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [movimientos, total] = await Promise.all([
      prisma.movimientoStock.findMany({
        where: { productoId },
        include: { usuario: { select: { nombre: true } } },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.movimientoStock.count({ where: { productoId } }),
    ]);

    return {
      data: movimientos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // --- Alertas de stock bajo ---
  async obtenerAlertasStockBajo() {
    const productos = await prisma.$queryRaw<any[]>`
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = true AND p.stock_actual <= p.stock_minimo
      ORDER BY (p.stock_actual - p.stock_minimo) ASC
    `;
    return productos;
  }

  // --- Categorías ---
  async listarCategorias() {
    return prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
  }

  async crearCategoria(nombre: string, margenSugeridoDefault: number = 30) {
    return prisma.categoria.create({
      data: { nombre, margenSugeridoDefault },
    });
  }
}

export const stockService = new StockService();

// ============================================
// Ale Motos — Stock Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { stockService } from './stock.service';

export class StockController {
  // --- Productos ---
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, categoriaId, stockBajo, page, limit } = req.query;
      const result = await stockService.listarProductos({
        search: search as string,
        categoriaId: categoriaId as string,
        stockBajo: stockBajo === 'true',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const producto = await stockService.obtenerProducto(req.params.id);
      res.json(producto);
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const producto = await stockService.crearProducto(req.body);
      res.status(201).json(producto);
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const producto = await stockService.actualizarProducto(req.params.id, req.body);
      res.json(producto);
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await stockService.eliminarProducto(req.params.id);
      res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  }

  // --- Stock ---
  async ajustarStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await stockService.ajustarStock({
        ...req.body,
        usuarioId: req.user!.userId,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async movimientos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await stockService.obtenerMovimientos(
        req.params.id,
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async alertas(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alertas = await stockService.obtenerAlertasStockBajo();
      res.json(alertas);
    } catch (error) {
      next(error);
    }
  }

  // --- Categorías ---
  async listarCategorias(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categorias = await stockService.listarCategorias();
      res.json(categorias);
    } catch (error) {
      next(error);
    }
  }

  async crearCategoria(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoria = await stockService.crearCategoria(req.body.nombre, req.body.margenSugeridoDefault);
      res.status(201).json(categoria);
    } catch (error) {
      next(error);
    }
  }

  async calcularPrecio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { costo, margen } = req.query;
      const precio = stockService.calcularPrecioSugerido(
        parseFloat(costo as string),
        parseFloat(margen as string),
      );
      res.json({ precioSugerido: precio });
    } catch (error) {
      next(error);
    }
  }
}

export const stockController = new StockController();

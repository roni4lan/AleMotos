// ============================================
// Ale Motos — Ventas Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ventasService } from './ventas.service';

export class VentasController {
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venta = await ventasService.crear(req.body, req.user!.userId);
      res.status(201).json(venta);
    } catch (error) {
      next(error);
    }
  }

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fechaDesde, fechaHasta, clienteId, page, limit } = req.query;
      const result = await ventasService.listar({
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
        clienteId: clienteId as string,
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
      const venta = await ventasService.obtener(req.params.id);
      res.json(venta);
    } catch (error) {
      next(error);
    }
  }
}

export const ventasController = new VentasController();

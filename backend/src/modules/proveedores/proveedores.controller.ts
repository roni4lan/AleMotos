// ============================================
// Ale Motos — Proveedores Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { proveedoresService } from './proveedores.service';

export class ProveedoresController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, page, limit } = req.query;
      const result = await proveedoresService.listar(
        search as string,
        page ? parseInt(page as string) : undefined,
        limit ? parseInt(limit as string) : undefined,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proveedor = await proveedoresService.obtener(req.params.id);
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proveedor = await proveedoresService.crear(req.body);
      res.status(201).json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proveedor = await proveedoresService.actualizar(req.params.id, req.body);
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await proveedoresService.eliminar(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const proveedoresController = new ProveedoresController();

// ============================================
// Ale Motos — Reparaciones Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { reparacionesService } from './reparaciones.service';

export class ReparacionesController {
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reparacion = await reparacionesService.crear(req.body, req.user!.userId);
      res.status(201).json(reparacion);
    } catch (error) {
      next(error);
    }
  }

  async cargarPresupuesto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reparacion = await reparacionesService.cargarPresupuesto(
        req.params.id,
        req.body,
        req.user!.userId,
      );
      res.json(reparacion);
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { estado, observaciones } = req.body;
      const reparacion = await reparacionesService.cambiarEstado(
        req.params.id,
        estado,
        req.user!.userId,
        observaciones,
      );
      res.json(reparacion);
    } catch (error) {
      next(error);
    }
  }

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { estado, motoId, page, limit, fechaInicio, fechaFin } = req.query;
      const result = await reparacionesService.listar({
        estado: estado as any,
        motoId: motoId as string,
        fechaInicio: fechaInicio as string,
        fechaFin: fechaFin as string,
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
      const reparacion = await reparacionesService.obtener(req.params.id);
      res.json(reparacion);
    } catch (error) {
      next(error);
    }
  }
}

export const reparacionesController = new ReparacionesController();

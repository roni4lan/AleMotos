// ============================================
// Ale Motos — Finanzas Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { finanzasService } from './finanzas.service';

export class FinanzasController {
  async resumen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fechaDesde, fechaHasta } = req.query;
      const result = await finanzasService.obtenerResumen(
        fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta ? new Date(fechaHasta as string) : undefined,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async ventasPorPeriodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { periodo, cantidad, offsetDias } = req.query;
      const result = await finanzasService.ventasPorPeriodo(
        (periodo as 'dia' | 'semana' | 'mes') || 'mes',
        cantidad ? parseInt(cantidad as string) : undefined,
        offsetDias ? parseInt(offsetDias as string) : 0
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async repuestosMasVendidos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;
      const result = await finanzasService.repuestosMasVendidos(
        limit ? parseInt(limit as string) : undefined,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async estadoStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await finanzasService.estadoStock();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Nuevos endpoints avanzados
  async alertasReposicionImpacto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dias } = req.query;
      const result = await finanzasService.obtenerAlertasImpactoReposicion(
        dias ? parseInt(dias as string) : 90
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async rotacionInventario(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await finanzasService.rotacionInventario();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async presupuestosPendientes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await finanzasService.presupuestosPendientes();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // CRUD Gastos Fijos
  async getGastosFijos(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await finanzasService.obtenerGastosFijos();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createGastoFijo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nombre, monto, frecuencia } = req.body;
      const result = await finanzasService.crearGastoFijo({ nombre, monto, frecuencia });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteGastoFijo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await finanzasService.eliminarGastoFijo(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const finanzasController = new FinanzasController();

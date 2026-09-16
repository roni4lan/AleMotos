// ============================================
// Ale Motos — Clientes Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { clientesService } from './clientes.service';

export class ClientesController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, page, limit } = req.query;
      const result = await clientesService.listar(
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
      const cliente = await clientesService.obtener(req.params.id);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cliente = await clientesService.crear(req.body);
      res.status(201).json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cliente = await clientesService.actualizar(req.params.id, req.body);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await clientesService.eliminar(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- Motos ---
  async obtenerModelosMotos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const modelos = await clientesService.obtenerModelosMotos();
      res.json(modelos);
    } catch (error) {
      next(error);
    }
  }

  async agregarMotoAnonima(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const moto = await clientesService.agregarMoto({
        ...req.body,
        clienteId: null, // Sin cliente
      });
      res.status(201).json(moto);
    } catch (error) {
      next(error);
    }
  }

  async agregarMoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const moto = await clientesService.agregarMoto({
        ...req.body,
        clienteId: req.params.id,
      });
      res.status(201).json(moto);
    } catch (error) {
      next(error);
    }
  }

  async actualizarMoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const moto = await clientesService.actualizarMoto(req.params.motoId, req.body);
      res.json(moto);
    } catch (error) {
      next(error);
    }
  }

  async eliminarMoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await clientesService.eliminarMoto(req.params.motoId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const clientesController = new ClientesController();

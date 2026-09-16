// ============================================
// Ale Motos — Portal Cliente Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import { portalClienteService } from './portal-cliente.service';

export class PortalClienteController {
  async buscar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dni, dominio } = req.query;

      let resultado = null;

      if (dni) {
        resultado = await portalClienteService.buscarPorDni(dni as string);
      } else if (dominio) {
        resultado = await portalClienteService.buscarPorDominio(dominio as string);
      }

      if (!resultado) {
        res.json({ encontrado: false, mensaje: 'No se encontraron resultados para la búsqueda.' });
        return;
      }

      res.json({ encontrado: true, data: resultado });
    } catch (error) {
      next(error);
    }
  }
}

export const portalClienteController = new PortalClienteController();

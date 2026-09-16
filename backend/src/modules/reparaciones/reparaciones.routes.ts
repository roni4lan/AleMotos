// ============================================
// Ale Motos — Reparaciones Routes
// ============================================

import { Router } from 'express';
import { reparacionesController } from './reparaciones.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res, next) => reparacionesController.listar(req, res, next));
router.get('/:id', (req, res, next) => reparacionesController.obtener(req, res, next));
router.post('/', (req, res, next) => reparacionesController.crear(req, res, next));
router.post('/:id/presupuesto', (req, res, next) => reparacionesController.cargarPresupuesto(req, res, next));
router.patch('/:id/estado', (req, res, next) => reparacionesController.cambiarEstado(req, res, next));

export default router;

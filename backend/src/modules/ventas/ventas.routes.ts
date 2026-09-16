// ============================================
// Ale Motos — Ventas Routes
// ============================================

import { Router } from 'express';
import { ventasController } from './ventas.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res, next) => ventasController.listar(req, res, next));
router.get('/:id', (req, res, next) => ventasController.obtener(req, res, next));
router.post('/', (req, res, next) => ventasController.crear(req, res, next));

export default router;

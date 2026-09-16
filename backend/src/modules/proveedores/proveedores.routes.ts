// ============================================
// Ale Motos — Proveedores Routes
// ============================================

import { Router } from 'express';
import { proveedoresController } from './proveedores.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res, next) => proveedoresController.listar(req, res, next));
router.get('/:id', (req, res, next) => proveedoresController.obtener(req, res, next));
router.post('/', (req, res, next) => proveedoresController.crear(req, res, next));
router.put('/:id', (req, res, next) => proveedoresController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => proveedoresController.eliminar(req, res, next));

export default router;

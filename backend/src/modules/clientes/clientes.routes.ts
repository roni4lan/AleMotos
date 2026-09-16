// ============================================
// Ale Motos — Clientes Routes
// ============================================

import { Router } from 'express';
import { clientesController } from './clientes.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Motos de un cliente o anonimas (rutas estáticas primero)
router.get('/motos/modelos', (req, res, next) => clientesController.obtenerModelosMotos(req, res, next));

// Clientes
router.get('/', (req, res, next) => clientesController.listar(req, res, next));
router.get('/:id', (req, res, next) => clientesController.obtener(req, res, next));
router.post('/', (req, res, next) => clientesController.crear(req, res, next));
router.put('/:id', (req, res, next) => clientesController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => clientesController.eliminar(req, res, next));

// Motos de un cliente o anonimas (rutas con parámetros)
router.post('/motos', (req, res, next) => clientesController.agregarMotoAnonima(req, res, next));
router.post('/:id/motos', (req, res, next) => clientesController.agregarMoto(req, res, next));
router.put('/:id/motos/:motoId', (req, res, next) => clientesController.actualizarMoto(req, res, next));
router.delete('/:id/motos/:motoId', (req, res, next) => clientesController.eliminarMoto(req, res, next));

export default router;

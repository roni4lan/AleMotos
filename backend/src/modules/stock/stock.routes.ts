// ============================================
// Ale Motos — Stock Routes
// ============================================

import { Router } from 'express';
import { stockController } from './stock.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Productos
router.get('/', (req, res, next) => stockController.listar(req, res, next));
router.get('/alertas', (req, res, next) => stockController.alertas(req, res, next));
router.get('/precio', (req, res, next) => stockController.calcularPrecio(req, res, next));
router.get('/:id', (req, res, next) => stockController.obtener(req, res, next));
router.post('/', (req, res, next) => stockController.crear(req, res, next));
router.put('/:id', (req, res, next) => stockController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => stockController.eliminar(req, res, next));

// Movimientos de stock
router.get('/:id/movimientos', (req, res, next) => stockController.movimientos(req, res, next));
router.post('/ajuste', (req, res, next) => stockController.ajustarStock(req, res, next));

// Categorías
router.get('/categorias/all', (req, res, next) => stockController.listarCategorias(req, res, next));
router.post('/categorias', (req, res, next) => stockController.crearCategoria(req, res, next));

export default router;

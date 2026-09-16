// ============================================
// Ale Motos — Finanzas Routes
// ============================================

import { Router } from 'express';
import { finanzasController } from './finanzas.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/resumen', (req, res, next) => finanzasController.resumen(req, res, next));
router.get('/ventas-periodo', (req, res, next) => finanzasController.ventasPorPeriodo(req, res, next));
router.get('/repuestos-top', (req, res, next) => finanzasController.repuestosMasVendidos(req, res, next));
router.get('/estado-stock', (req, res, next) => finanzasController.estadoStock(req, res, next));

// Nuevas rutas avanzadas
router.get('/alertas-reposicion', (req, res, next) => finanzasController.alertasReposicionImpacto(req, res, next));
router.get('/rotacion-inventario', (req, res, next) => finanzasController.rotacionInventario(req, res, next));
router.get('/presupuestos-pendientes', (req, res, next) => finanzasController.presupuestosPendientes(req, res, next));

// CRUD Gastos Fijos
router.get('/gastos-fijos', (req, res, next) => finanzasController.getGastosFijos(req, res, next));
router.post('/gastos-fijos', (req, res, next) => finanzasController.createGastoFijo(req, res, next));
router.delete('/gastos-fijos/:id', (req, res, next) => finanzasController.deleteGastoFijo(req, res, next));

export default router;

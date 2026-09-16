// ============================================
// Ale Motos — Express Server
// ============================================

import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './modules/auth/auth.routes';
import stockRoutes from './modules/stock/stock.routes';
import clientesRoutes from './modules/clientes/clientes.routes';
import proveedoresRoutes from './modules/proveedores/proveedores.routes';
import ventasRoutes from './modules/ventas/ventas.routes';
import reparacionesRoutes from './modules/reparaciones/reparaciones.routes';
import portalClienteRoutes from './modules/portal-cliente/portal-cliente.routes';
import finanzasRoutes from './modules/finanzas/finanzas.routes';

const app = express();

// ---- Middleware Global ----
app.use(cors({
  origin: config.isDev ? '*' : process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, { 
    module: 'http',
    query: req.query,
  });
  next();
});

// ---- Health Check ----
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: config.business.name,
  });
});

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reparaciones', reparacionesRoutes);
app.use('/api/portal', portalClienteRoutes);
app.use('/api/finanzas', finanzasRoutes);

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'RUTA_NO_ENCONTRADA',
      message: 'La ruta solicitada no existe',
      details: {},
    },
  });
});

// ---- Error Handler (siempre último) ----
app.use(errorHandler);

// ---- Start Server ----
app.listen(config.port, '0.0.0.0', () => {
  logger.info(`🏍️  ${config.business.name} Backend corriendo en puerto ${config.port}`, {
    module: 'server',
    env: config.nodeEnv,
  });
});

export default app;

// ============================================
// Ale Motos — Configuración centralizada
// ============================================

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  db: {
    url: process.env.DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },

  business: {
    name: process.env.BUSINESS_NAME || 'Ale Motos',
  },

  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

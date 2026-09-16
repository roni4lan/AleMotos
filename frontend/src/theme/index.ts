// ============================================
// Ale Motos — Theme & Design Tokens
// ============================================

// Nombre del negocio (configurable)
export const BUSINESS_NAME = 'Ale Motos';

// Colores principales
export const colors = {
  // Background
  bg: {
    primary: '#0a0a0a',
    secondary: '#111111',
    tertiary: '#1a1a1a',
    card: '#141414',
    hover: '#1f1f1f',
    input: '#181818',
  },

  // Accent (rojo/naranja — estética taller)
  accent: {
    primary: '#e63946',    // Rojo principal
    secondary: '#ff6b35',  // Naranja
    gradient: 'linear-gradient(135deg, #e63946 0%, #ff6b35 100%)',
    hover: '#ff4757',
    subtle: 'rgba(230, 57, 70, 0.1)',
    border: 'rgba(230, 57, 70, 0.3)',
  },

  // Text
  text: {
    primary: '#f5f5f5',
    secondary: '#a0a0a0',
    tertiary: '#666666',
    inverse: '#0a0a0a',
  },

  // Estado — consistentes en todo el sistema
  status: {
    success: '#2ecc71',     // Verde: ok, entregado, sincronizado
    warning: '#f39c12',     // Amarillo: stock bajo, en proceso
    danger: '#e74c3c',      // Rojo: sin stock, urgente, error
    info: '#3498db',        // Azul: información
  },

  // Grises metálicos
  metal: {
    light: '#8a8a8a',
    medium: '#555555',
    dark: '#333333',
    border: '#2a2a2a',
  },
};

// Tipografía
export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  sizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    '4xl': '2.5rem', // 40px
  },
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

// Espaciado
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

// Border radius
export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(230, 57, 70, 0.15)',
  glowStrong: '0 0 40px rgba(230, 57, 70, 0.25)',
};

// Breakpoints
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
};

// Transitions
export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '400ms ease',
};

// Estados de reparación con colores y labels
export const estadoReparacion = {
  recibido: { label: 'Recibido', color: colors.status.info, icon: '📥' },
  presupuestado: { label: 'Presupuestado', color: colors.status.warning, icon: '📋' },
  en_proceso: { label: 'En Proceso', color: colors.status.warning, icon: '🔧' },
  listo: { label: 'Listo para Entregar', color: colors.status.success, icon: '✨' },
  entregado: { label: 'Entregado', color: colors.status.success, icon: '🏍️' },
};

// Métodos de pago
export const metodosPago = {
  efectivo: { label: 'Efectivo', icon: '💵' },
  transferencia: { label: 'Transferencia', icon: '🏦' },
  tarjeta_debito: { label: 'Débito', icon: '💳' },
  tarjeta_credito: { label: 'Crédito', icon: '💳' },
  combinado: { label: 'Combinado', icon: '🔄' },
};

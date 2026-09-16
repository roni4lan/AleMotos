// ============================================
// Ale Motos — Errores de dominio
// ============================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;

  constructor(code: string, message: string, statusCode: number = 400, details: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

// Errores de dominio predefinidos
export const DomainErrors = {
  STOCK_INSUFICIENTE: (producto: string, disponible: number, solicitado: number) =>
    new AppError('STOCK_INSUFICIENTE', `No hay stock suficiente del producto ${producto}`, 409, { disponible, solicitado }),

  PRODUCTO_NO_ENCONTRADO: (id: string) =>
    new AppError('PRODUCTO_NO_ENCONTRADO', `Producto no encontrado: ${id}`, 404),

  CLIENTE_NO_ENCONTRADO: (id: string) =>
    new AppError('CLIENTE_NO_ENCONTRADO', `Cliente no encontrado: ${id}`, 404),

  PROVEEDOR_NO_ENCONTRADO: (id: string) =>
    new AppError('PROVEEDOR_NO_ENCONTRADO', `Proveedor no encontrado: ${id}`, 404),

  MOTO_NO_ENCONTRADA: (id: string) =>
    new AppError('MOTO_NO_ENCONTRADA', `Moto no encontrada: ${id}`, 404),

  REPARACION_NO_ENCONTRADA: (id: string) =>
    new AppError('REPARACION_NO_ENCONTRADA', `Reparación no encontrada: ${id}`, 404),

  VENTA_NO_ENCONTRADA: (id: string) =>
    new AppError('VENTA_NO_ENCONTRADA', `Venta no encontrada: ${id}`, 404),

  TRANSICION_ESTADO_INVALIDA: (estadoActual: string, estadoSolicitado: string) =>
    new AppError('TRANSICION_ESTADO_INVALIDA', `No se puede pasar de "${estadoActual}" a "${estadoSolicitado}"`, 422, { estadoActual, estadoSolicitado }),

  CONFLICTO_SINCRONIZACION: (uuidLocal: string) =>
    new AppError('CONFLICTO_SINCRONIZACION', `Registro ya existe con uuid_local: ${uuidLocal}`, 409, { uuidLocal }),

  CREDENCIALES_INVALIDAS: () =>
    new AppError('CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos', 401),

  TOKEN_INVALIDO: () =>
    new AppError('TOKEN_INVALIDO', 'Token de autenticación inválido o expirado', 401),

  NO_AUTORIZADO: () =>
    new AppError('NO_AUTORIZADO', 'No tiene permisos para realizar esta acción', 403),

  DNI_DUPLICADO: (dni: string) =>
    new AppError('DNI_DUPLICADO', `Ya existe un cliente con DNI: ${dni}`, 409),

  DOMINIO_DUPLICADO: (dominio: string) =>
    new AppError('DOMINIO_DUPLICADO', `Ya existe una moto con dominio: ${dominio}`, 409),

  SKU_DUPLICADO: (sku: string) =>
    new AppError('SKU_DUPLICADO', `Ya existe un producto con SKU: ${sku}`, 409),
};

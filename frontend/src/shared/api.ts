// ============================================
// Ale Motos — API Service
// ============================================

import { syncEngine } from './sync/syncEngine';
import { db } from './db/dexie';

const API_URL = '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('ale_motos_token');
    syncEngine.init(this);
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('ale_motos_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('ale_motos_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('ale_motos_token');
  }

  async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        code: error?.error?.code || 'ERROR_DESCONOCIDO',
        message: error?.error?.message || 'Error en la solicitud',
        details: error?.error?.details || {},
      };
    }

    return response.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  getProfile() {
    return this.request<any>('/auth/profile');
  }

  // Stock
  async getProductos(params?: Record<string, string>) {
    const isOffline = !navigator.onLine;

    if (!isOffline) {
      try {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return await this.request<any>(`/stock${query}`);
      } catch (err: any) {
        // Si el servidor devolvió un 4xx/5xx válido, lo lanzamos. Si es un fallo de red, usamos fallback.
        if (err.status && err.status >= 400 && err.status !== 408) throw err;
        console.warn('Network error when fetching products, falling back to offline cache.');
      }
    }

    // OFFLINE FALLBACK
    const search = params?.search?.toLowerCase() || '';
    const limit = parseInt(params?.limit || '50');
    
    // Buscar en IndexedDB
    let query = db.productos.filter(p => {
      if (!p.activo) return false;
      if (!search) return true;
      return (
        p.nombre.toLowerCase().includes(search) || 
        p.sku.toLowerCase().includes(search) ||
        (p.modelosCompatibles && p.modelosCompatibles.some(m => m.toLowerCase().includes(search)))
      );
    });
    
    const data = await query.limit(limit).toArray();
    
    return {
      data,
      pagination: {
        page: 1,
        limit,
        total: data.length,
        totalPages: 1
      },
      offline: true
    };
  }

  getProducto(id: string) {
    return this.request<any>(`/stock/${id}`);
  }

  createProducto(data: any) {
    return this.request<any>('/stock', { method: 'POST', body: data });
  }

  updateProducto(id: string, data: any) {
    return this.request<any>(`/stock/${id}`, { method: 'PUT', body: data });
  }

  deleteProducto(id: string) {
    return this.request<any>(`/stock/${id}`, { method: 'DELETE' });
  }

  getAlertasStock() {
    return this.request<any>('/stock/alertas');
  }

  getMovimientosStock(productoId: string, params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/stock/${productoId}/movimientos${query}`);
  }

  ajustarStock(data: { productoId: string; cantidad: number; motivo: string }) {
    return this.request<any>('/stock/ajuste', { method: 'POST', body: data });
  }

  getCategorias() {
    return this.request<any>('/stock/categorias/all');
  }

  calcularPrecio(costo: number, margen: number) {
    return this.request<any>(`/stock/precio?costo=${costo}&margen=${margen}`);
  }

  // Ventas
  getVentas(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/ventas${query}`);
  }

  getVenta(id: string) {
    return this.request<any>(`/ventas/${id}`);
  }

  createVenta(data: any) {
    // Offline-first route
    if (!data.uuidLocal) throw new Error("uuidLocal es requerido para ventas offline-first");
    return syncEngine.enqueueMutation('/ventas', 'POST', data, data.uuidLocal);
  }

  // Reparaciones
  getReparaciones(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/reparaciones${query}`);
  }

  getReparacion(id: string) {
    return this.request<any>(`/reparaciones/${id}`);
  }

  createReparacion(data: any) {
    // Offline-first route
    if (!data.uuidLocal) throw new Error("uuidLocal es requerido para reparaciones offline-first");
    return syncEngine.enqueueMutation('/reparaciones', 'POST', data, data.uuidLocal);
  }

  cargarPresupuesto(id: string, data: any) {
    return this.request<any>(`/reparaciones/${id}/presupuesto`, { method: 'POST', body: data });
  }

  cambiarEstadoReparacion(id: string, estado: string, observaciones?: string) {
    return this.request<any>(`/reparaciones/${id}/estado`, {
      method: 'PATCH',
      body: { estado, observaciones },
    });
  }

  // Clientes
  getClientes(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/clientes${query}`);
  }

  getCliente(id: string) {
    return this.request<any>(`/clientes/${id}`);
  }

  createCliente(data: any) {
    return this.request<any>('/clientes', { method: 'POST', body: data });
  }

  updateCliente(id: string, data: any) {
    return this.request<any>(`/clientes/${id}`, { method: 'PUT', body: data });
  }

  deleteCliente(id: string) {
    return this.request<any>(`/clientes/${id}`, { method: 'DELETE' });
  }

  addMoto(clienteId: string, data: any) {
    if (!clienteId) {
      return this.request<any>('/clientes/motos', { method: 'POST', body: data });
    }
    return this.request<any>(`/clientes/${clienteId}/motos`, { method: 'POST', body: data });
  }

  getModelosMotos() {
    return this.request<any>('/clientes/motos/modelos');
  }

  // Proveedores
  getProveedores(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/proveedores${query}`);
  }

  getProveedor(id: string) {
    return this.request<any>(`/proveedores/${id}`);
  }

  createProveedor(data: any) {
    return this.request<any>('/proveedores', { method: 'POST', body: data });
  }

  updateProveedor(id: string, data: any) {
    return this.request<any>(`/proveedores/${id}`, { method: 'PUT', body: data });
  }

  deleteProveedor(id: string) {
    return this.request<any>(`/proveedores/${id}`, { method: 'DELETE' });
  }

  // Portal Cliente (público)
  buscarPortal(params: { dni?: string; dominio?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<any>(`/portal/buscar?${query}`);
  }

  // --- FINANZAS ---
  obtenerResumenFinanzas = async (desde?: string, hasta?: string) => {
    const params = new URLSearchParams();
    if (desde) params.append('fechaDesde', desde);
    if (hasta) params.append('fechaHasta', hasta);
    const res = await this.request<any>(`/finanzas/resumen?${params.toString()}`);
    return res;
  };
  obtenerVentasPorPeriodo = async (periodo: string, cantidad?: number) => {
    const params = new URLSearchParams({ periodo });
    if (cantidad) params.append('cantidad', cantidad.toString());
    const res = await this.request<any>(`/finanzas/ventas-periodo?${params.toString()}`);
    return res;
  };
  obtenerRepuestosTop = async (limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const res = await this.request<any>(`/finanzas/repuestos-top?${params.toString()}`);
    return res;
  };
  obtenerEstadoStockFinanzas = async () => {
    const res = await this.request<any>('/finanzas/estado-stock');
    return res;
  };
  obtenerAlertasReposicionImpacto = async (dias: number = 90) => {
    const res = await this.request<any>(`/finanzas/alertas-reposicion?dias=${dias}`);
    return res;
  };

  getResumenFinanciero(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/finanzas/resumen${query}`);
  }

  getVentasPorPeriodo(periodo: string = 'mes', cantidad: number = 12, offsetDias: number = 0) {
    return this.request<any>(`/finanzas/ventas-periodo?periodo=${periodo}&cantidad=${cantidad}&offsetDias=${offsetDias}`);
  }

  getRepuestosTop(limit: number = 10) {
    return this.request<any>(`/finanzas/repuestos-top?limit=${limit}`);
  }

  getEstadoStock() {
    return this.request<any>('/finanzas/estado-stock');
  }

  getRotacionInventario() {
    return this.request<any>('/finanzas/rotacion-inventario');
  }

  getPresupuestosPendientes() {
    return this.request<any>('/finanzas/presupuestos-pendientes');
  }

  getGastosFijos() {
    return this.request<any>('/finanzas/gastos-fijos');
  }

  createGastoFijo(data: any) {
    return this.request<any>('/finanzas/gastos-fijos', { method: 'POST', body: data });
  }

  deleteGastoFijo(id: string) {
    return this.request<any>(`/finanzas/gastos-fijos/${id}`, { method: 'DELETE' });
  }

  // Health check
  health() {
    return this.request<any>('/health');
  }
}

export const api = new ApiService();

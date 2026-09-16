// ============================================
// Ale Motos — Stock Page
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../shared/api';
import { Edit2, Trash2, Search, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useDialog } from '../../shared/components/DialogProvider';

// ── HID/USB barcode scanner (keyboard-wedge) ──────────────────────────
function useBarcodeScanner(enabled: boolean, onScan: (code: string) => void) {
  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      // Allow scanning when SKU input is focused (scanner types into it)
      const isSkuInput = (e.target as HTMLElement)?.id === 'scanner-sku-input';
      if ((tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && !isSkuInput) return;

      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      if (delta > 100) bufferRef.current = '';

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        if (code.length >= 3) onScan(code);
        bufferRef.current = '';
        return;
      }
      if (e.key.length === 1) bufferRef.current += e.key;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onScan]);
}

export function StockPage() {
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [productos, setProductos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [pagination, setPagination] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState('50');

  const [activeSuggestionField, setActiveSuggestionField] = useState<'sku' | 'nombre' | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Scanner state
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'scanning' | 'found' | 'notfound'>('idle');
  const scannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    sku: '', nombre: '', categoriaId: '', proveedorId: '',
    precioCosto: '', margenPorcentaje: '', precioVenta: '',
    stockActual: '0', stockMinimo: '0', modelosCompatibles: '',
  });

  const loadProductos = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: itemsPerPage
      };
      if (searchQuery) params.search = searchQuery;
      const result = await api.getProductos(params);
      setProductos(result?.data || []);
      setPagination(result.pagination || {});
    } catch (err) {
      console.error('Error loading products:', err);
    }
    setLoading(false);
  };

  const loadCategorias = async () => {
    try {
      const cats = await api.getCategorias();
      setCategorias(cats);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadProductos(debouncedSearch);
  }, [debouncedSearch, currentPage, itemsPerPage]);

  useEffect(() => {
    const query = activeSuggestionField === 'sku' ? form.sku : (activeSuggestionField === 'nombre' ? form.nombre : '');
    if (!query || editingProduct || !activeSuggestionField) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.getProductos({ search: query, limit: '5' });
        setSuggestions(res.data);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.sku, form.nombre, activeSuggestionField, editingProduct]);

  // ── Barcode scan handler ──────────────────────────────────────
  const handleScan = useCallback(async (code: string) => {
    setScannerStatus('scanning');
    if (scannerTimeoutRef.current) clearTimeout(scannerTimeoutRef.current);
    try {
      const res = await api.getProductos({ search: code, limit: '5' });
      // Prefer exact SKU match, fall back to first result
      const match = res.data.find((p: any) =>
        p.sku && p.sku.toLowerCase() === code.toLowerCase()
      ) || (res.data.length === 1 ? res.data[0] : null);

      if (match) {
        setScannerStatus('found');
        handleEdit(match);
      } else {
        setScannerStatus('notfound');
        // Open create modal with SKU pre-filled
        resetForm();
        setEditingProduct(null);
        setForm(prev => ({ ...prev, sku: code }));
        setShowModal(true);
      }
    } catch {
      setScannerStatus('idle');
    }
    scannerTimeoutRef.current = setTimeout(() => setScannerStatus('idle'), 2500);
  }, []);

  useBarcodeScanner(scannerEnabled, handleScan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingProduct && form.sku) {
        const res = await api.getProductos({ search: form.sku, limit: '1' });
        const match = res.data.find((p: any) => p.sku && p.sku.toLowerCase() === form.sku.toLowerCase());
        
        if (match) {
          const ok = await showConfirm(
            `El producto con código ${form.sku} ya existe (${match.nombre}). ¿Deseas editarlo en lugar de crear uno nuevo?`,
            "Producto Existente"
          );
          if (ok) {
            handleEdit(match);
          } else {
            setForm({ ...form, sku: '' });
          }
          return;
        }
      }

      const data = {
        ...form,
        precioCosto: parseFloat(form.precioCosto),
        margenPorcentaje: form.margenPorcentaje ? parseFloat(form.margenPorcentaje) : undefined,
        precioVenta: form.precioVenta ? parseFloat(form.precioVenta) : undefined,
        stockActual: parseInt(form.stockActual),
        stockMinimo: parseInt(form.stockMinimo),
        modelosCompatibles: form.modelosCompatibles.split(',').map(s => s.trim()).filter(Boolean),
        proveedorId: form.proveedorId || undefined,
      };

      if (editingProduct) {
        await api.updateProducto(editingProduct.id, data);
      } else {
        await api.createProducto(data);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProductos(search);
    } catch (err: any) {
      showAlert(err.message || 'Error al guardar producto');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await showConfirm('¿Estás seguro de que deseas eliminar este producto?', 'Eliminar Producto');
    if (!ok) return;
    try {
      await api.deleteProducto(id);
      loadProductos(search);
    } catch (err: any) {
      showAlert(err.message || 'Error al eliminar');
    }
  };

  const handleEdit = (producto: any) => {
    setEditingProduct(producto);
    setForm({
      sku: producto.sku,
      nombre: producto.nombre,
      categoriaId: producto.categoriaId,
      proveedorId: producto.proveedorId || '',
      precioCosto: String(producto.precioCosto),
      margenPorcentaje: String(producto.margenPorcentaje),
      precioVenta: String(producto.precioVenta),
      stockActual: String(producto.stockActual),
      stockMinimo: String(producto.stockMinimo),
      modelosCompatibles: (producto.modelosCompatibles || []).join(', '),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      sku: '', nombre: '', categoriaId: '', proveedorId: '',
      precioCosto: '', margenPorcentaje: '', precioVenta: '',
      stockActual: '0', stockMinimo: '0', modelosCompatibles: '',
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

  const getStockBadge = (producto: any) => {
    if (producto.stockActual === 0) return <span className="badge badge-danger">Sin stock</span>;
    if (producto.stockBajo) return <span className="badge badge-warning">Stock bajo</span>;
    return <span className="badge badge-success">OK</span>;
  };

  const handleCalcularPorcentaje = async () => {
    if (!form.precioCosto) {
      showAlert("Por favor, ingresa el Precio de Costo primero.");
      return;
    }
    const costo = parseFloat(form.precioCosto);
    if (isNaN(costo) || costo <= 0) {
      showAlert("Precio de Costo inválido.");
      return;
    }

    const porcentajeStr = await showPrompt("Ingresa el porcentaje de ganancia (ej. 30):", "Calcular Precio de Venta", "");
    if (!porcentajeStr) return; 

    const porcentaje = parseFloat(porcentajeStr.replace(',', '.'));
    if (isNaN(porcentaje) || porcentaje <= 0) {
      showAlert("Porcentaje inválido.");
      return;
    }

    const precioVentaCalculado = costo + (costo * porcentaje / 100);
    const confirmado = await showConfirm(`El precio de venta calculado es ${formatCurrency(precioVentaCalculado)}.\n¿Deseas aplicarlo?`, "Confirmar Precio");
    
    if (confirmado) {
      setForm({ ...form, precioVenta: precioVentaCalculado.toFixed(2), margenPorcentaje: porcentajeStr });
    }
  };

  const renderSuggestions = (field: 'sku' | 'nombre') => {
    if (activeSuggestionField !== field || suggestions.length === 0 || editingProduct) return null;
    return (
      <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 shadow-lg rounded-xl z-50 max-h-48 overflow-y-auto divide-y divide-zinc-100">
        {suggestions.map(p => (
          <div key={p.id} className="p-3 hover:bg-zinc-50 cursor-pointer flex flex-col gap-1 transition-colors" onMouseDown={(e) => {
            e.preventDefault(); // Prevents onBlur from firing before click
            handleEdit(p);
            setActiveSuggestionField(null);
          }}>
            <div className="font-semibold text-sm text-zinc-900">{p.nombre}</div>
            <div className="text-xs text-zinc-500">SKU: {p.sku} • Stock: {p.stockActual}</div>
          </div>
        ))}
      </div>
    );
  };

  const totalPages = pagination.totalPages || 1;

  const scannerStatusInfo = {
    idle:     { color: '#71717a', label: 'Listo para escanear' },
    scanning: { color: '#f59e0b', label: 'Buscando producto...' },
    found:    { color: '#22c55e', label: '¡Producto encontrado!' },
    notfound: { color: '#dc2626', label: 'No encontrado — completá los datos' },
  }[scannerStatus];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Stock de Repuestos</h1>
          <p className="page-subtitle">{pagination.total || 0} productos en catálogo</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          {/* Scanner toggle */}
          <button
            onClick={() => { setScannerEnabled(v => !v); setScannerStatus('idle'); }}
            title={scannerEnabled ? 'Desactivar scanner' : 'Activar scanner de código de barras'}
            style={{
              height: '38px', padding: '0 14px', borderRadius: '8px',
              border: `1.5px solid ${scannerEnabled ? '#dc2626' : '#e4e4e7'}`,
              background: scannerEnabled ? '#fef2f2' : '#fff',
              color: scannerEnabled ? '#dc2626' : '#71717a',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontWeight: 600, fontSize: '0.875rem', transition: 'all 150ms',
            }}
          >
            <span style={{ fontSize: '1rem' }}>📷</span>
            {scannerEnabled ? 'Scanner ON' : 'Scanner'}
            {scannerEnabled && (
              <span style={{
                display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
                background: scannerStatusInfo.color, marginLeft: '2px',
                transition: 'background 300ms',
              }} />
            )}
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }}>
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Scanner active banner */}
      {scannerEnabled && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: '#18181b', borderRadius: '12px', padding: '12px 18px',
          marginBottom: '1rem', border: '1px solid #3f3f46',
        }}>
          <span style={{
            display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
            background: scannerStatusInfo.color,
            boxShadow: scannerStatus !== 'idle' ? `0 0 0 4px ${scannerStatusInfo.color}33` : 'none',
            flexShrink: 0, transition: 'all 300ms',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>
              Scanner activo — {scannerStatusInfo.label}
            </div>
            <div style={{ color: '#71717a', fontSize: '0.78rem', marginTop: '2px' }}>
              Escaneá un código de barras: si existe se abre para editar; si no, se crea con el código precargado.
            </div>
          </div>
          <button
            onClick={() => { setScannerEnabled(false); setScannerStatus('idle'); }}
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      {/* Search */}
      <div className="search-input-wrapper" style={{ marginBottom: 'var(--sp-lg)', maxWidth: '500px' }}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nombre, código o modelo compatible..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'right' }}>Venta</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id}>
                  <td><code style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>{p.sku}</code></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                    {p.modelosCompatibles?.length > 0 && (
                      <div className="text-xs text-secondary">{p.modelosCompatibles.join(', ')}</div>
                    )}
                  </td>
                  <td className="text-secondary">{p.categoria?.nombre || '-'}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(p.precioCosto)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.precioVenta)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: p.stockActual <= p.stockMinimo ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                      {p.stockActual}
                    </span>
                    {p.stockReservado > 0 && (
                      <span className="text-xs text-warning" style={{ marginLeft: 4 }}>({p.stockReservado} res.)</span>
                    )}
                  </td>
                  <td>{getStockBadge(p)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex gap-xs" style={{ justifyContent: 'center' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <span className="empty-state-icon">📦</span>
                      <span className="empty-state-title">No hay productos</span>
                      <span className="empty-state-text">Agregá tu primer producto al catálogo</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && productos.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Mostrar</span>
            <select 
              className="form-input py-1 px-2 text-sm w-auto"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-zinc-500">por página</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Anterior
            </button>
            <span className="text-sm font-medium px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 className="modal-title">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                {scannerEnabled && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: '#f4f4f5', borderRadius: '999px',
                    padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, color: '#71717a',
                  }}>
                    <span style={{
                      display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
                      background: scannerStatusInfo.color, transition: 'background 300ms',
                    }} />
                    {scannerStatusInfo.label}
                  </div>
                )}
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group relative">
                  <label className="form-label">SKU / Código</label>
                  <input 
                    id="scanner-sku-input"
                    className="form-input" 
                    value={form.sku} 
                    onChange={e => setForm({ ...form, sku: e.target.value })} 
                    onFocus={() => setActiveSuggestionField('sku')}
                    onBlur={() => setTimeout(() => setActiveSuggestionField(null), 200)}
                    disabled={!!editingProduct} 
                    placeholder={scannerEnabled && !editingProduct ? 'Escaneá o escribí el código...' : 'Dejar vacío para auto-generar'}
                    style={scannerEnabled && !editingProduct ? {
                      borderColor: '#dc2626',
                      boxShadow: '0 0 0 2px rgba(220,38,38,0.1)',
                    } : {}}
                  />
                  {renderSuggestions('sku')}
                </div>
                <div className="form-group relative">
                  <label className="form-label">Nombre</label>
                  <input 
                    className="form-input" 
                    value={form.nombre} 
                    onChange={e => setForm({ ...form, nombre: e.target.value })} 
                    onFocus={() => setActiveSuggestionField('nombre')}
                    onBlur={() => setTimeout(() => setActiveSuggestionField(null), 200)}
                    required 
                  />
                  {renderSuggestions('nombre')}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-input" value={form.categoriaId} onChange={e => setForm({ ...form, categoriaId: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Modelos Compatibles</label>
                  <input className="form-input" value={form.modelosCompatibles} onChange={e => setForm({ ...form, modelosCompatibles: e.target.value })} placeholder="Honda CG 150, Yamaha YBR 125..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio de Costo</label>
                  <input className="form-input" type="number" step="0.01" value={form.precioCosto} onChange={e => setForm({ ...form, precioCosto: e.target.value })} required />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={handleCalcularPorcentaje}>
                    Calcular por %
                  </button>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio de Venta</label>
                  <input className="form-input" type="number" step="0.01" value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: e.target.value })} placeholder="Manual" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stock Actual</label>
                  <input className="form-input" type="number" value={form.stockActual} onChange={e => setForm({ ...form, stockActual: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Mínimo</label>
                  <input className="form-input" type="number" value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

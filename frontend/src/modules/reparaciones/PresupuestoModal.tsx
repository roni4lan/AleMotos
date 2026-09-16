import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api';
import { useDialog } from '../../shared/components/DialogProvider';

interface PresupuestoModalProps {
  reparacion: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function PresupuestoModal({ reparacion, onClose, onSuccess }: PresupuestoModalProps) {
  const { showAlert } = useDialog();
  const [loading, setLoading] = useState(false);
  const [totalManoObra, setTotalManoObra] = useState<number | ''>('');
  
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [repuestos, setRepuestos] = useState<any[]>([]);

  useEffect(() => {
    if (search.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await api.getProductos({ search: search.trim(), limit: '5' });
        setSearchResults(result.data);
      } catch { setSearchResults([]); }
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const addRepuesto = (producto: any) => {
    const existing = repuestos.find(r => r.productoId === producto.id);
    if (existing) {
      if (existing.cantidad >= producto.stockDisponible) {
        showAlert('No hay más stock disponible de este producto.');
        return;
      }
      setRepuestos(repuestos.map(r => 
        r.productoId === producto.id ? { ...r, cantidad: r.cantidad + 1 } : r
      ));
    } else {
      if (producto.stockDisponible <= 0) {
        showAlert('No hay stock disponible para este producto.');
        return;
      }
      setRepuestos([...repuestos, {
        productoId: producto.id,
        nombre: producto.nombre,
        precioVenta: producto.precioVenta,
        cantidad: 1,
        stockDisponible: producto.stockDisponible,
      }]);
    }
    setSearch('');
    setSearchResults([]);
  };

  const removeRepuesto = (productoId: string) => {
    setRepuestos(repuestos.filter(r => r.productoId !== productoId));
  };

  const updateCantidad = (productoId: string, cantidad: number) => {
    if (cantidad < 1) return removeRepuesto(productoId);
    setRepuestos(repuestos.map(r => 
      r.productoId === productoId ? { ...r, cantidad: Math.min(cantidad, r.stockDisponible) } : r
    ));
  };

  const totalRepuestosCosto = repuestos.reduce((sum, r) => sum + (r.precioVenta * r.cantidad), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalManoObra === '') {
      showAlert('Debes ingresar el costo de mano de obra.');
      return;
    }
    
    setLoading(true);
    try {
      await api.cargarPresupuesto(reparacion.id, {
        repuestos: repuestos.map(r => ({
          productoId: r.productoId,
          cantidad: r.cantidad
        })),
        totalManoObra: Number(totalManoObra)
      });
      onSuccess();
    } catch (err: any) {
      showAlert(err.message || 'Error al guardar el presupuesto');
      setLoading(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}>
      <div className="modal" style={{ width: '600px', maxWidth: '95vw', overflow: 'visible', margin: 'auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">Presupuestar Reparación</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>
          <div className="modal-body" style={{ overflowY: 'visible', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label mb-sm">Buscar Repuestos</label>
              <div style={{ position: 'relative' }}>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
                <input
                  type="text"
                  className="input w-full h-10 shadow-sm transition-colors"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Buscar por nombre o código..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50 divide-y divide-border">
                    {searchResults.map(p => (
                      <div 
                        key={p.id}
                        className="p-3 flex justify-between items-center cursor-pointer hover:bg-secondary/40 transition-colors"
                        onClick={() => addRepuesto(p)}
                      >
                        <div className="font-semibold text-foreground">{p.nombre}</div>
                        <div className="text-xs font-medium">
                          <span className={p.stockDisponible > 0 ? 'text-success font-bold' : 'text-destructive font-bold'}>
                            Stock: {p.stockDisponible}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {repuestos.length > 0 && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label mb-sm">Repuestos a Utilizar</label>
              <div className="flex flex-col gap-2">
                {repuestos.map(r => (
                  <div key={r.productoId} className="flex items-center justify-between p-3 bg-secondary/10 border border-border rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{r.nombre}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatCurrency(r.precioVenta)} c/u</div>
                    </div>
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                        <button 
                          type="button" 
                          onClick={() => updateCantidad(r.productoId, r.cantidad - 1)} 
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                        </button>
                        <div className="w-8 text-center font-medium text-sm text-foreground">
                          {r.cantidad}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => updateCantidad(r.productoId, r.cantidad + 1)} 
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </button>
                      </div>
                      <div className="w-24 text-right font-bold text-foreground">
                        {formatCurrency(r.precioVenta * r.cantidad)}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => updateCantidad(r.productoId, 0)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                        title="Quitar repuesto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end items-center mt-2 px-2">
                  <span className="text-sm font-semibold text-muted-foreground mr-3 uppercase tracking-wide">Total Repuestos:</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(totalRepuestosCosto)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-group mt-md">
            <label className="form-label">Costo de Mano de Obra ($)</label>
            <input
              type="number"
              className="form-input"
              value={totalManoObra}
              onChange={e => setTotalManoObra(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              required
            />
          </div>

          </div>

          <div className="modal-footer mt-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              Total: {formatCurrency(totalRepuestosCosto + (Number(totalManoObra) || 0))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Presupuesto'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Ale Motos — Ventas POS Page
// ============================================

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../shared/api';
import { useOnlineStatus } from '../../shared/hooks/useOnlineStatus';
import { useDialog } from '../../shared/components/DialogProvider';

interface CartItem {
  productoId: string;
  nombre: string;
  sku: string;
  precioVenta: number;
  cantidad: number;
  descuento: number;
  stockDisponible: number;
}

export function VentasPage() {
  const { showAlert } = useDialog();
  const isOnline = useOnlineStatus();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [tipoDescuento, setTipoDescuento] = useState<'monto' | 'porcentaje'>('monto');
  const [pagoEfectivo, setPagoEfectivo] = useState(0);
  const [ventas, setVentas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [showHistorial, setShowHistorial] = useState(false);
  const [expandedVenta, setExpandedVenta] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadVentas = async () => {
    try {
      const result = await api.getVentas({ limit: '20' });
      setVentas(result?.data || []);
    } catch (err) {
      console.error('Error loading ventas:', err);
    }
  };

  useEffect(() => { 
    loadVentas(); 
    
    const handleSync = () => loadVentas();
    window.addEventListener('sync:completed', handleSync);
    
    api.getClientes({ limit: '100' }).then(r => setClientes(r?.data || [])).catch(() => setClientes([]));

    return () => window.removeEventListener('sync:completed', handleSync);
  }, []);

  useEffect(() => {
    if (search.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await api.getProductos({ search: search.trim(), limit: '8' });
        setSearchResults(result.data);
      } catch { setSearchResults([]); }
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const addToCart = (producto: any) => {
    const existing = cart.find(i => i.productoId === producto.id);
    if (existing) {
      if (existing.cantidad >= producto.stockDisponible) {
        showAlert('No hay más stock disponible');
        return;
      }
      setCart(cart.map(i =>
        i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
      ));
    } else {
      if (producto.stockDisponible <= 0) {
        showAlert('No hay stock disponible para este producto');
        return;
      }
      setCart([...cart, {
        productoId: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        precioVenta: producto.precioVenta,
        cantidad: 1,
        descuento: 0,
        stockDisponible: producto.stockDisponible,
      }]);
    }
    setSearch('');
    setSearchResults([]);
  };

  const updateQty = (productoId: string, qty: number) => {
    if (qty < 1) return removeFromCart(productoId);
    setCart(cart.map(i =>
      i.productoId === productoId ? { ...i, cantidad: Math.min(qty, i.stockDisponible) } : i
    ));
  };

  const removeFromCart = (productoId: string) => {
    setCart(cart.filter(i => i.productoId !== productoId));
  };

  const subtotal = cart.reduce((sum, i) => sum + (i.precioVenta * i.cantidad - i.descuento), 0);
  const descuentoCalculado = tipoDescuento === 'porcentaje'
    ? subtotal * (descuentoGlobal / 100)
    : descuentoGlobal;
  const total = subtotal - descuentoCalculado;
  const vuelto = metodoPago === 'efectivo' && pagoEfectivo > total ? pagoEfectivo - total : 0;

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.dni && c.dni.includes(clientSearch))
  );

  const handleCreateClienteRapido = async () => {
    if (!nuevoClienteNombre.trim()) return;
    try {
      const res = await api.createCliente({ nombre: nuevoClienteNombre });
      setClientes([...clientes, res]);
      setClienteId(res.id);
      setShowNuevoCliente(false);
      setNuevoClienteNombre('');
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const handleConfirm = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const uuidLocal = uuidv4();
      await api.createVenta({
        uuidLocal,
        clienteId: clienteId || undefined,
        metodoPago,
        descuento: descuentoCalculado,
        items: cart.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          descuento: i.descuento,
        })),
      });
      setCart([]);
      setDescuentoGlobal(0);
      setTipoDescuento('monto');
      setPagoEfectivo(0);
      setClienteId('');
      loadVentas();
      showAlert('✅ Venta registrada exitosamente', 'Éxito');
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'Error');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🛒 Punto de Venta</h1>
          <p className="page-subtitle">Ventas de mostrador</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowHistorial(!showHistorial)}>
          {showHistorial ? '← Volver al POS' : '📋 Historial'}
        </button>
      </div>

      {showHistorial ? (
        /* Historial de Ventas */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Método</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v: any) => (
                <React.Fragment key={v.id}>
                  <tr 
                    style={{ cursor: 'pointer', background: expandedVenta === v.id ? 'var(--bg-hover)' : 'transparent', transition: 'background 150ms' }}
                    onClick={() => setExpandedVenta(expandedVenta === v.id ? null : v.id)}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseOut={e => { if (expandedVenta !== v.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', transform: expandedVenta === v.id ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 150ms' }}>▶</span>
                        {new Date(v.fecha).toLocaleString('es-AR')}
                      </div>
                    </td>
                    <td>{v.cliente?.nombre || 'Consumidor final'}</td>
                    <td>{v.items?.length || 0} productos</td>
                    <td><span className="badge badge-info">{v.metodoPago.replace('_', ' ')}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(v.total)}</td>
                  </tr>
                  
                  {expandedVenta === v.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid var(--metal-border)' }}>
                        <div style={{ padding: 'var(--sp-md) var(--sp-lg)', backgroundColor: '#fafafa', borderRadius: '0.5rem' }}>
                          <h4 style={{ paddingLeft: '12px', marginBottom: 'var(--sp-sm)', color: '#71717a', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Detalle de los productos</h4>
                          <table style={{ width: '100%', background: 'transparent', border: 'none', marginBottom: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7', color: '#71717a', background: 'transparent' }}>Producto</th>
                                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7', color: '#71717a', background: 'transparent', textAlign: 'center' }}>Cant.</th>
                                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7', color: '#71717a', background: 'transparent', textAlign: 'right' }}>Precio Unit.</th>
                                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7', color: '#71717a', background: 'transparent', textAlign: 'right' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.items?.map((item: any) => (
                                <tr key={item.id} style={{ background: 'transparent' }}>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5' }}>
                                    <div style={{ fontWeight: 600, color: '#18181b' }}>{item.producto?.nombre}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#71717a' }}>{item.producto?.sku}</div>
                                  </td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5', textAlign: 'center', color: '#18181b' }}>{item.cantidad}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5', textAlign: 'right', color: '#18181b' }}>{formatCurrency(item.precioUnitarioCongelado)}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5', textAlign: 'right', color: '#18181b', fontWeight: 600 }}>
                                    {formatCurrency(item.precioUnitarioCongelado * item.cantidad - (item.descuento || 0))}
                                    {item.descuento > 0 && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginLeft: '6px' }}>(-{formatCurrency(item.descuento)})</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {v.descuento > 0 && (
                            <div style={{ textAlign: 'right', marginTop: 'var(--sp-sm)', paddingRight: '12px', fontWeight: 600, color: '#ca8a04' }}>
                              Descuento global aplicado en esta venta: -{formatCurrency(v.descuento)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* POS */
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 380px', alignItems: 'start' }}>
          {/* Left: Search + Results */}
          <div>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
              <input
                type="text"
                className="input w-full h-12 text-lg shadow-sm transition-colors"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Buscar producto por nombre, código o modelo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {searchResults.length > 0 && (
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-6 divide-y divide-border">
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    className={`p-4 flex justify-between items-center transition-colors ${
                      p.stockDisponible <= 0 
                        ? 'bg-secondary/20 cursor-not-allowed opacity-70' 
                        : 'cursor-pointer hover:bg-secondary/40'
                    }`}
                    onClick={() => {
                      if (p.stockDisponible > 0) addToCart(p);
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <div className={`font-semibold ${p.stockDisponible <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {p.nombre}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{p.sku}</span>
                        <span>•</span>
                        <span className={p.stockDisponible <= 0 ? 'text-destructive font-bold' : ''}>
                          Stock: {p.stockDisponible}
                        </span>
                        {p.stockDisponible <= 0 && (
                          <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Agotado</span>
                        )}
                      </div>
                    </div>
                    <div className={`font-bold text-lg ${p.stockDisponible <= 0 ? 'text-muted-foreground' : 'text-primary'}`}>
                      {formatCurrency(p.precioVenta)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Table */}
            {cart.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ textAlign: 'center' }}>Cant.</th>
                      <th style={{ textAlign: 'right' }}>Precio</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.productoId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                          <div className="text-xs text-secondary">{item.sku}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="flex items-center gap-xs" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => updateQty(item.productoId, item.cantidad - 1)}>-</button>
                            <span style={{ fontWeight: 700, minWidth: 30, textAlign: 'center' }}>{item.cantidad}</span>
                            <button className="btn btn-ghost btn-sm" onClick={() => updateQty(item.productoId, item.cantidad + 1)}>+</button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.precioVenta)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.precioVenta * item.cantidad)}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(item.productoId)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {cart.length === 0 && (
              <div className="empty-state" style={{ padding: 'var(--sp-2xl)' }}>
                <span className="empty-state-icon">🛒</span>
                <span className="empty-state-title">Carrito vacío</span>
                <span className="empty-state-text">Buscá y agregá productos para iniciar una venta</span>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--header-height) + var(--sp-xl))' }}>
            <h3 className="card-title" style={{ marginBottom: 'var(--sp-lg)' }}>Resumen de Venta</h3>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="form-label" style={{ marginBottom: 0 }}>Cliente (Opcional)</span>
                {!showNuevoCliente && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNuevoCliente(true)}>+ Nuevo</button>
                )}
              </div>
              {showNuevoCliente ? (
                <div className="flex gap-sm">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre y Apellido"
                    value={nuevoClienteNombre}
                    onChange={e => setNuevoClienteNombre(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateClienteRapido}>Guardar</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNuevoCliente(false)}>✕</button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar cliente..."
                    value={
                      clienteId 
                        ? clientes.find(c => c.id === clienteId)?.nombre || 'Consumidor Final'
                        : clientSearch
                    }
                    onChange={e => {
                      setClienteId('');
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => {
                      if (clienteId) {
                        setClienteId('');
                        setClientSearch(clientes.find(c => c.id === clienteId)?.nombre || '');
                      }
                      setShowClientDropdown(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowClientDropdown(false), 200);
                    }}
                  />
                  {showClientDropdown && (
                    <div className="search-results" style={{ backgroundColor: '#ffffff', zIndex: 50, border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                      <div 
                        className="search-item"
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #e4e4e7' }}
                        onMouseDown={() => {
                          setClienteId('');
                          setClientSearch('');
                          setShowClientDropdown(false);
                        }}
                      >
                        <strong>Consumidor Final</strong>
                      </div>
                      {filteredClientes.map(c => (
                        <div 
                          key={c.id}
                          className="search-item"
                          style={{ padding: '8px 12px', cursor: 'pointer' }}
                          onMouseDown={() => {
                            setClienteId(c.id);
                            setClientSearch('');
                            setShowClientDropdown(false);
                          }}
                        >
                          {c.nombre} <span style={{ color: '#71717a', fontSize: '0.85rem', marginLeft: '6px' }}>{c.dni ? `DNI: ${c.dni}` : ''}</span>
                        </div>
                      ))}
                      {filteredClientes.length === 0 && (
                        <div style={{ padding: '8px 12px', color: '#71717a', fontSize: '0.9rem' }}>
                          No se encontraron clientes
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between mb-md">
              <span className="text-secondary">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Descuento global</span>
                <select 
                  style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '0.375rem', color: '#18181b', outline: 'none', fontWeight: 600, padding: '4px 8px', fontSize: '0.85rem', cursor: 'pointer' }}
                  value={tipoDescuento}
                  onChange={e => setTipoDescuento(e.target.value as 'monto' | 'porcentaje')}
                >
                  <option value="monto">$ Monto</option>
                  <option value="porcentaje">% Porcentaje</option>
                </select>
              </label>
              <input
                className="form-input"
                type="number"
                value={descuentoGlobal === 0 ? '' : descuentoGlobal}
                onChange={e => setDescuentoGlobal(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="flex justify-between mb-md" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatCurrency(total)}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Método de Pago</label>
              <select className="form-input" value={metodoPago} onChange={e => { setMetodoPago(e.target.value); setPagoEfectivo(0); }}>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="tarjeta_debito">💳 Débito</option>
                <option value="tarjeta_credito">💳 Crédito</option>
                <option value="combinado">🔄 Combinado</option>
              </select>
            </div>

            {metodoPago === 'efectivo' && (
              <>
                <div className="form-group">
                  <label className="form-label">Paga con ($)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={pagoEfectivo === 0 ? '' : pagoEfectivo}
                    onChange={e => setPagoEfectivo(Number(e.target.value))}
                    min={0}
                    placeholder={`Mínimo ${formatCurrency(total)}`}
                  />
                </div>
                
                {pagoEfectivo > 0 && (
                  <div className="flex justify-between mb-md" style={{ 
                    padding: 'var(--sp-md)', 
                    background: pagoEfectivo >= total ? 'var(--success-bg, rgba(46, 204, 113, 0.1))' : 'var(--danger-bg, rgba(231, 76, 60, 0.1))',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${pagoEfectivo >= total ? 'var(--success-color, #2ecc71)' : 'var(--danger-color, #e74c3c)'}`
                  }}>
                    <span style={{ fontWeight: 600, color: pagoEfectivo >= total ? 'var(--success-color, #2ecc71)' : 'var(--danger-color, #e74c3c)' }}>
                      {pagoEfectivo >= total ? 'Vuelto a entregar' : 'Falta dinero'}
                    </span>
                    <span style={{ fontWeight: 800, color: pagoEfectivo >= total ? 'var(--success-color, #2ecc71)' : 'var(--danger-color, #e74c3c)' }}>
                      {pagoEfectivo >= total ? formatCurrency(vuelto) : formatCurrency(total - pagoEfectivo)}
                    </span>
                  </div>
                )}
              </>
            )}

            <button
              className="btn btn-primary btn-lg w-full"
              onClick={handleConfirm}
              disabled={cart.length === 0 || processing || (metodoPago === 'efectivo' && pagoEfectivo > 0 && pagoEfectivo < total)}
              style={{ marginTop: 'var(--sp-md)' }}
            >
              {processing ? 'Procesando...' : `✅ Confirmar Venta — ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

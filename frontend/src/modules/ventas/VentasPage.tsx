// ============================================
// Ale Motos — Ventas POS Page
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// ── HID/USB barcode scanner (keyboard-wedge) detection ─────────────────────
function useBarcodeScanner(onScan: (code: string) => void) {
  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if focus is on a form input (user is typing manually)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Scanners type chars very fast (< 80ms between chars). Reset on slow input.
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
  }, [onScan]);
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
  const [ticketData, setTicketData] = useState<any | null>(null);

  // Product cards
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productFilter, setProductFilter] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Camera scanner
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const zxingReaderRef = useRef<any>(null);

  const loadVentas = async () => {
    try {
      const result = await api.getVentas({ limit: '20' });
      setVentas(result?.data || []);
    } catch (err) {
      console.error('Error loading ventas:', err);
    }
  };

  const loadAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const result = await api.getProductos({ limit: '200' });
      setAllProducts(result.data || []);
    } catch {
      setAllProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => { 
    loadVentas();
    loadAllProducts();
    
    const handleSync = () => { loadVentas(); loadAllProducts(); };
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

  // HID scanner handler
  const handleHidScan = useCallback(async (code: string) => {
    try {
      const result = await api.getProductos({ search: code, limit: '1' });
      const producto = result.data?.[0];
      if (producto) {
        addToCartDirect(producto);
      } else {
        showAlert(`No se encontró producto con código: ${code}`, 'Scanner');
      }
    } catch {
      showAlert('Error al buscar producto escaneado', 'Scanner');
    }
  }, []);

  useBarcodeScanner(handleHidScan);

  // Camera scanner
  const startCameraScanner = async () => {
    setScannerError('');
    setScannerActive(true);
    setShowCameraScanner(true);
    try {
      // @ts-ignore
      const { BrowserMultiFormatReader } = await import('https://unpkg.com/@zxing/browser@0.1.1/es2015/index.js').catch(() => { throw new Error('No se pudo cargar el lector. Verificá conexión a internet.'); });
      const reader = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;
      if (!videoRef.current) return;
      reader.decodeFromVideoDevice(undefined, videoRef.current, async (result: any, _err: any) => {
        if (result) {
          const code = result.getText();
          stopCameraScanner();
          await handleHidScan(code);
        }
      });
    } catch (e: any) {
      setScannerError(e.message || 'Error al acceder a la cámara');
      setScannerActive(false);
    }
  };

  const stopCameraScanner = () => {
    if (zxingReaderRef.current) {
      try { zxingReaderRef.current.reset(); } catch {}
      zxingReaderRef.current = null;
    }
    setScannerActive(false);
    setShowCameraScanner(false);
    setScannerError('');
  };

  const addToCartDirect = (producto: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productoId === producto.id);
      if (existing) {
        if (existing.cantidad >= producto.stockDisponible) {
          showAlert('No hay más stock disponible');
          return prev;
        }
        return prev.map(i =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      } else {
        if (producto.stockDisponible <= 0) {
          showAlert('No hay stock disponible para este producto');
          return prev;
        }
        return [...prev, {
          productoId: producto.id,
          nombre: producto.nombre,
          sku: producto.sku,
          precioVenta: producto.precioVenta,
          cantidad: 1,
          descuento: 0,
          stockDisponible: producto.stockDisponible,
        }];
      }
    });
  };

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

  // Filtered product cards
  const filteredProducts = productFilter
    ? allProducts.filter(p =>
        p.nombre.toLowerCase().includes(productFilter.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productFilter.toLowerCase()))
      )
    : allProducts;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

  // ── Product card component ──────────────────────────────────────────────
  const ProductCard = ({ p }: { p: any }) => {
    const inCart = cart.find(i => i.productoId === p.id);
    const outOfStock = p.stockDisponible <= 0;
    return (
      <div
        onClick={() => { if (!outOfStock) addToCart(p); }}
        title={outOfStock ? 'Sin stock' : `Agregar ${p.nombre}`}
        style={{
          background: outOfStock ? '#fafafa' : '#fff',
          border: `1.5px solid ${inCart ? '#dc2626' : '#e4e4e7'}`,
          borderRadius: '10px',
          padding: '10px 12px',
          cursor: outOfStock ? 'not-allowed' : 'pointer',
          opacity: outOfStock ? 0.5 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          transition: 'all 140ms ease',
          position: 'relative',
          boxShadow: inCart ? '0 0 0 2px rgba(220,38,38,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
        onMouseEnter={e => {
          if (!outOfStock) {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = '#dc2626';
            el.style.boxShadow = '0 4px 16px rgba(220,38,38,0.18)';
          }
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = inCart ? '#dc2626' : '#e4e4e7';
          el.style.boxShadow = inCart ? '0 0 0 2px rgba(220,38,38,0.15)' : '0 1px 3px rgba(0,0,0,0.05)';
        }}
      >
        {inCart && (
          <div style={{
            position: 'absolute', top: '6px', right: '8px',
            background: '#dc2626', color: '#fff', borderRadius: '999px',
            fontSize: '10px', fontWeight: 700, padding: '1px 6px', lineHeight: '16px',
          }}>
            ×{inCart.cantidad}
          </div>
        )}
        <div style={{
          fontSize: '0.775rem', fontWeight: 600, color: outOfStock ? '#a1a1aa' : '#18181b',
          lineHeight: '1.2', overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          paddingRight: inCart ? '28px' : '0',
        }}>
          {p.nombre}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#a1a1aa', fontFamily: 'monospace' }}>{p.sku}</div>
        <div style={{
          fontSize: '0.82rem', fontWeight: 700,
          color: outOfStock ? '#a1a1aa' : '#dc2626',
          marginTop: '2px',
        }}>
          {formatCurrency(p.precioVenta)}
        </div>
        <div style={{ fontSize: '0.65rem', color: outOfStock ? '#ef4444' : '#71717a' }}>
          {outOfStock ? '⚠ Sin stock' : `Stock: ${p.stockDisponible}`}
        </div>
      </div>
    );
  };

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
    // Snapshot venta data before clearing
    const snapCart = [...cart];
    const snapTotal = total;
    const snapSubtotal = subtotal;
    const snapDescuento = descuentoCalculado;
    const snapMetodo = metodoPago;
    const snapPago = pagoEfectivo;
    const snapVuelto = vuelto;
    const snapClienteNombre = clienteId
      ? clientes.find(c => c.id === clienteId)?.nombre || 'Consumidor Final'
      : 'Consumidor Final';
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
      // Mostrar ticket
      setTicketData({
        fecha: new Date(),
        numero: uuidLocal.slice(0, 8).toUpperCase(),
        cliente: snapClienteNombre,
        items: snapCart,
        subtotal: snapSubtotal,
        descuento: snapDescuento,
        total: snapTotal,
        metodoPago: snapMetodo,
        pagoEfectivo: snapPago,
        vuelto: snapVuelto,
      });
      setCart([]);
      setDescuentoGlobal(0);
      setTipoDescuento('monto');
      setPagoEfectivo(0);
      setClienteId('');
      loadVentas();
      loadAllProducts();
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'Error');
    } finally {
      setProcessing(false);
    }
  };

  const printTicket = () => {
    if (!ticketData) return;
    const fmtCur = (v: number) =>
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
    const fmtDate = (d: Date) =>
      d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const metodoLabel: Record<string, string> = {
      efectivo: 'Efectivo', transferencia: 'Transferencia',
      tarjeta_debito: 'Tarjeta Débito', tarjeta_credito: 'Tarjeta Crédito', combinado: 'Combinado',
    };
    const dash = '─'.repeat(32);

    const rows = ticketData.items.map((i: CartItem) => `
      <tr>
        <td style="padding:2px 0;font-size:11px;">${i.nombre}</td>
        <td style="padding:2px 0;font-size:11px;text-align:center;">${i.cantidad}</td>
        <td style="padding:2px 0;font-size:11px;text-align:right;">${fmtCur(i.precioVenta)}</td>
        <td style="padding:2px 0;font-size:11px;text-align:right;font-weight:700;">${fmtCur(i.precioVenta * i.cantidad)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Ticket Ale Motos</title>
    <style>
      @page { margin: 4mm; size: 80mm auto; }
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; background: #fff; width: 72mm; }
      .center { text-align: center; }
      .right { text-align: right; }
      .bold { font-weight: 700; }
      .logo { font-size: 22px; font-weight: 900; letter-spacing: 2px; }
      .sub { font-size: 10px; color: #444; }
      .sep { border: none; border-top: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      th { font-size: 10px; text-transform: uppercase; border-bottom: 1px dashed #000; padding-bottom: 3px; }
      .total-row td { font-size: 13px; font-weight: 900; padding-top: 4px; }
      .footer { font-size: 10px; text-align: center; color: #444; margin-top: 8px; }
    </style></head><body>
    <div class="center" style="margin-bottom:6px;">
      <div class="logo">ALE MOTOS</div>
      <div class="sub">Casa de Repuestos y Taller Mecánico</div>
      <div class="sub" style="margin-top:2px;">Tel: — Dir: —</div>
    </div>
    <hr class="sep">
    <div style="font-size:11px;margin-bottom:4px;">
      <div><b>Ticket N°:</b> ${ticketData.numero}</div>
      <div><b>Fecha:</b> ${fmtDate(ticketData.fecha)}</div>
      <div><b>Cliente:</b> ${ticketData.cliente}</div>
    </div>
    <hr class="sep">
    <table>
      <thead><tr>
        <th style="text-align:left;">Producto</th>
        <th style="text-align:center;">Cant</th>
        <th style="text-align:right;">P.Unit</th>
        <th style="text-align:right;">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <hr class="sep">
    <table style="margin-top:2px;">
      ${ ticketData.subtotal !== ticketData.total ? `<tr><td style="font-size:11px;">Subtotal</td><td style="font-size:11px;text-align:right;">${fmtCur(ticketData.subtotal)}</td></tr>` : '' }
      ${ ticketData.descuento > 0 ? `<tr><td style="font-size:11px;">Descuento</td><td style="font-size:11px;text-align:right;">-${fmtCur(ticketData.descuento)}</td></tr>` : '' }
      <tr class="total-row"><td>TOTAL</td><td style="text-align:right;">${fmtCur(ticketData.total)}</td></tr>
      <tr><td style="font-size:11px;">Método de pago</td><td style="font-size:11px;text-align:right;">${metodoLabel[ticketData.metodoPago] || ticketData.metodoPago}</td></tr>
      ${ ticketData.metodoPago === 'efectivo' && ticketData.pagoEfectivo > 0 ? `
        <tr><td style="font-size:11px;">Efectivo recibido</td><td style="font-size:11px;text-align:right;">${fmtCur(ticketData.pagoEfectivo)}</td></tr>
        <tr><td style="font-size:11px;font-weight:700;">Vuelto</td><td style="font-size:11px;text-align:right;font-weight:700;">${fmtCur(ticketData.vuelto)}</td></tr>
      ` : '' }
    </table>
    <hr class="sep">
    <div class="footer">
      <div>¡Gracias por su compra!</div>
      <div style="margin-top:2px;">Conserve este comprobante</div>
      <div style="margin-top:4px;font-size:9px;">alemotos.com</div>
    </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

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
                <th style={{ textAlign: 'center', width: '48px' }}></th>
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
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          // Reconstruct subtotal from items
                          const itemsSubtotal = (v.items || []).reduce(
                            (sum: number, i: any) => sum + (i.precioUnitarioCongelado * i.cantidad - (i.descuento || 0)),
                            0
                          );
                          setTicketData({
                            fecha: new Date(v.fecha),
                            numero: v.id.slice(0, 8).toUpperCase(),
                            cliente: v.cliente?.nombre || 'Consumidor Final',
                            items: (v.items || []).map((i: any) => ({
                              productoId: i.productoId,
                              nombre: i.producto?.nombre || 'Producto',
                              sku: i.producto?.sku || '',
                              precioVenta: i.precioUnitarioCongelado,
                              cantidad: i.cantidad,
                              descuento: i.descuento || 0,
                              stockDisponible: 0,
                            })),
                            subtotal: itemsSubtotal + (v.descuento || 0),
                            descuento: v.descuento || 0,
                            total: v.total,
                            metodoPago: v.metodoPago,
                            pagoEfectivo: 0,
                            vuelto: 0,
                          });
                        }}
                        title="Imprimir ticket"
                        style={{
                          background: 'none', border: '1px solid #e4e4e7',
                          borderRadius: '6px', cursor: 'pointer',
                          padding: '4px 8px', fontSize: '0.9rem',
                          color: '#71717a', transition: 'all 150ms',
                          lineHeight: 1,
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.borderColor = '#dc2626';
                          el.style.color = '#dc2626';
                          el.style.background = '#fef2f2';
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.borderColor = '#e4e4e7';
                          el.style.color = '#71717a';
                          el.style.background = 'none';
                        }}
                      >
                        🖨️
                      </button>
                    </td>
                  </tr>
                  
                  {expandedVenta === v.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid var(--metal-border)' }}>
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
          {/* Left: Search + Scanner + Products + Cart */}
          <div>
            {/* Search bar + scanner button */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }}>🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="input w-full"
                  style={{ paddingLeft: '2.5rem', height: '48px', fontSize: '1rem' }}
                  placeholder="Buscar por nombre, código o SKU..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                onClick={() => showCameraScanner ? stopCameraScanner() : startCameraScanner()}
                title="Escanear código de barras con cámara"
                style={{
                  height: '48px', padding: '0 16px', borderRadius: '10px',
                  border: `1.5px solid ${showCameraScanner ? '#dc2626' : '#e4e4e7'}`,
                  background: showCameraScanner ? '#fef2f2' : '#fff',
                  color: showCameraScanner ? '#dc2626' : '#71717a',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  fontWeight: 600, fontSize: '0.85rem', transition: 'all 150ms',
                  whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => {
                  if (!showCameraScanner) {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = '#dc2626';
                    el.style.color = '#dc2626';
                  }
                }}
                onMouseLeave={e => {
                  if (!showCameraScanner) {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = '#e4e4e7';
                    el.style.color = '#71717a';
                  }
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>📷</span>
                {showCameraScanner ? 'Cerrar cámara' : 'Escanear'}
              </button>
            </div>

            {/* Camera scanner panel */}
            {showCameraScanner && (
              <div style={{
                background: '#18181b', borderRadius: '14px', padding: '16px',
                marginBottom: '1rem', border: '1px solid #3f3f46',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                      background: scannerActive ? '#22c55e' : '#ef4444',
                      boxShadow: scannerActive ? '0 0 0 3px rgba(34,197,94,0.25)' : 'none',
                    }} />
                    {scannerActive ? 'Cámara activa — apuntá al código de barras' : 'Iniciando cámara...'}
                  </div>
                  <button onClick={stopCameraScanner} style={{ color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
                </div>
                {scannerError ? (
                  <div style={{ color: '#f87171', fontSize: '0.875rem', padding: '8px 0' }}>
                    ⚠ {scannerError}
                    <div style={{ marginTop: '8px', color: '#71717a', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      💡 Tip: los scanners USB/HID funcionan directo sin cámara — simplemente escaneá mientras el cursor esté sobre la página.
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover', background: '#27272a' }}
                    autoPlay
                    muted
                    playsInline
                  />
                )}
              </div>
            )}

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

            {/* ── Product Quick-Access Cards ─────────────────────── */}
            {!searchResults.length && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Productos disponibles
                    {allProducts.length > 0 && (
                      <span style={{ background: '#f4f4f5', color: '#71717a', borderRadius: '999px', padding: '1px 8px', fontWeight: 700, fontSize: '0.75rem' }}>
                        {filteredProducts.filter(p => p.stockDisponible > 0).length} con stock
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={productFilter}
                    onChange={e => setProductFilter(e.target.value)}
                    style={{
                      height: '30px', padding: '0 10px', borderRadius: '8px',
                      border: '1px solid #e4e4e7', fontSize: '0.8rem', outline: 'none',
                      background: '#fff', color: '#18181b', width: '160px',
                    }}
                  />
                </div>

                {loadingProducts ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#a1a1aa', fontSize: '0.875rem' }}>Cargando productos...</div>
                ) : filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#a1a1aa', fontSize: '0.875rem' }}>No hay productos que coincidan</div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
                    gap: '8px',
                    maxHeight: cart.length > 0 ? '260px' : '400px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingTop: '2px',
                    paddingRight: '2px',
                    paddingBottom: '2px',
                  }}>
                    {filteredProducts.map(p => <ProductCard key={p.id} p={p} />)}
                  </div>
                )}
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

            {cart.length === 0 && !loadingProducts && (
              <div style={{ textAlign: 'center', padding: '8px', color: '#a1a1aa', fontSize: '0.8rem', marginTop: '4px' }}>
                Hacé clic en una card o buscá para agregar al carrito
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

      {/* ══════════════════════════════════════════
          TICKET MODAL
          ══════════════════════════════════════════ */}
      {ticketData && (
        <div
          onClick={() => setTicketData(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              width: '100%', maxWidth: '360px',
              overflow: 'hidden',
              animation: 'ticketIn 200ms ease',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
              padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                🖨️ Ticket generado
              </div>
              <button
                onClick={() => setTicketData(null)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Ticket preview */}
            <div style={{
              padding: '20px 24px',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '12px',
              color: '#111',
              lineHeight: 1.55,
              borderBottom: '1px solid #e4e4e7',
            }}>
              {/* Logo */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '3px', color: '#18181b' }}>ALE MOTOS</div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>Casa de Repuestos y Taller Mecánico</div>
              </div>

              <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

              {/* Info */}
              <div style={{ fontSize: '11px', marginBottom: '8px', color: '#27272a' }}>
                <div><b>Ticket N°:</b> {ticketData.numero}</div>
                <div><b>Fecha:</b> {ticketData.fecha.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div><b>Cliente:</b> {ticketData.cliente}</div>
              </div>

              <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

              {/* Items header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#71717a', paddingBottom: '4px', borderBottom: '1px dashed #ccc', marginBottom: '4px' }}>
                <span>Producto</span>
                <span style={{ textAlign: 'center' }}>Cant</span>
                <span style={{ textAlign: 'right' }}>Precio</span>
                <span style={{ textAlign: 'right' }}>Subtot.</span>
              </div>

              {/* Items */}
              {ticketData.items.map((i: CartItem, idx: number) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0 6px', fontSize: '11px', padding: '3px 0', borderBottom: '1px solid #f4f4f5' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.nombre}</span>
                  <span style={{ textAlign: 'center', color: '#71717a' }}>{i.cantidad}</span>
                  <span style={{ textAlign: 'right', color: '#71717a' }}>{formatCurrency(i.precioVenta)}</span>
                  <span style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(i.precioVenta * i.cantidad)}</span>
                </div>
              ))}

              <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

              {/* Totals */}
              <div style={{ fontSize: '11px' }}>
                {ticketData.subtotal !== ticketData.total && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(ticketData.subtotal)}</span>
                  </div>
                )}
                {ticketData.descuento > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Descuento</span>
                    <span>-{formatCurrency(ticketData.descuento)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #e4e4e7' }}>
                  <span>TOTAL</span>
                  <span>{formatCurrency(ticketData.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#52525b' }}>
                  <span>Método de pago</span>
                  <span style={{ fontWeight: 600 }}>
                    {{ efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta_debito: 'Débito', tarjeta_credito: 'Crédito', combinado: 'Combinado' }[ticketData.metodoPago as string] || ticketData.metodoPago}
                  </span>
                </div>
                {ticketData.metodoPago === 'efectivo' && ticketData.pagoEfectivo > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#52525b' }}>
                      <span>Efectivo recibido</span>
                      <span>{formatCurrency(ticketData.pagoEfectivo)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#16a34a' }}>
                      <span>Vuelto</span>
                      <span>{formatCurrency(ticketData.vuelto)}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0 6px' }} />

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#71717a' }}>
                <div>¡Gracias por su compra!</div>
                <div style={{ marginTop: '2px' }}>Conserve este comprobante</div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ padding: '14px 20px', display: 'flex', gap: '10px', background: '#fafafa' }}>
              <button
                onClick={printTicket}
                style={{
                  flex: 1, height: '42px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #18181b, #27272a)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.9rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
              >
                🖨️ Imprimir ticket
              </button>
              <button
                onClick={() => setTicketData(null)}
                style={{
                  height: '42px', padding: '0 18px', borderRadius: '10px',
                  background: '#fff', border: '1.5px solid #e4e4e7',
                  color: '#71717a', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  transition: 'all 150ms',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = '#dc2626'; el.style.color = '#dc2626'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = '#e4e4e7'; el.style.color = '#71717a'; }}
              >
                Cerrar
              </button>
            </div>
          </div>

          <style>{`
            @keyframes ticketIn {
              from { opacity: 0; transform: scale(0.94) translateY(10px); }
              to   { opacity: 1; transform: scale(1)   translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

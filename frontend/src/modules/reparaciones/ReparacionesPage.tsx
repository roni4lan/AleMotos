// ============================================
// Ale Motos — Reparaciones Page
// ============================================

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../shared/api';
import { estadoReparacion } from '../../theme';
import { useDialog } from '../../shared/components/DialogProvider';
import { PresupuestoModal } from './PresupuestoModal';
import { generarPDFPresupuesto } from '../../shared/utils/pdf';

export function ReparacionesPage() {
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [reparaciones, setReparaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [detalle, setDetalle] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);

  const [form, setForm] = useState({
    clienteId: '', motoId: '', descripcionProblema: '',
  });

  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoClienteForm, setNuevoClienteForm] = useState({ nombre: '', dni: '', telefono: '', email: '', direccion: '' });

  const [showNuevaMoto, setShowNuevaMoto] = useState(false);
  const [nuevaMotoForm, setNuevaMotoForm] = useState({ dominio: '', marca: '', modelo: '' });
  const [anonMotos, setAnonMotos] = useState<any[]>([]);

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [showMarcaDropdown, setShowMarcaDropdown] = useState(false);
  const [showModeloDropdown, setShowModeloDropdown] = useState(false);

  const [modelosMotos, setModelosMotos] = useState<any[]>([]);

  const [reparacionAPresupuestar, setReparacionAPresupuestar] = useState<any>(null);

  const loadReparaciones = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      };
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroFechaInicio) params.fechaInicio = filtroFechaInicio;
      if (filtroFechaFin) params.fechaFin = filtroFechaFin;
      
      const result = await api.getReparaciones(params);
      setReparaciones(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotalItems(result?.pagination?.total || (result?.data || []).length);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { loadReparaciones(); }, [filtroEstado, filtroFechaInicio, filtroFechaFin, currentPage]);

  useEffect(() => {
    api.getClientes({ limit: '100' }).then(r => setClientes(r?.data || [])).catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    if (showModal) {
      api.getModelosMotos().then(r => setModelosMotos(r || [])).catch(() => {});
    }
  }, [showModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevaMotoForm.marca || !nuevaMotoForm.modelo) {
      showAlert("La marca y el modelo de la moto son obligatorios.");
      return;
    }

    if (!nuevaMotoForm.dominio) {
      const proceed = await showConfirm("Advertencia: No ingresaste la patente de la moto. ¿Estás seguro que deseas guardarla así?");
      if (!proceed) return;
    }

    try {
      const moto = await api.addMoto(form.clienteId, nuevaMotoForm);
      await api.createReparacion({
        ...form,
        motoId: moto.id,
        uuidLocal: uuidv4(),
      });
      setShowModal(false);
      setNuevaMotoForm({ dominio: '', marca: '', modelo: '' });
      loadReparaciones();
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const handleCreateClienteRapido = async () => {
    if (!nuevoClienteForm.nombre.trim()) return;
    try {
      const payload: Record<string, string> = { nombre: nuevoClienteForm.nombre };
      if (nuevoClienteForm.dni.trim()) payload.dni = nuevoClienteForm.dni;
      if (nuevoClienteForm.telefono.trim()) payload.telefono = nuevoClienteForm.telefono;
      if (nuevoClienteForm.email.trim()) payload.email = nuevoClienteForm.email;
      if (nuevoClienteForm.direccion.trim()) payload.direccion = nuevoClienteForm.direccion;
      const res = await api.createCliente(payload);
      setClientes([...clientes, res]);
      setForm({ ...form, clienteId: res.id, motoId: '' });
      setShowNuevoCliente(false);
      setNuevoClienteForm({ nombre: '', dni: '', telefono: '', email: '', direccion: '' });
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  // Removed handleCreateMotoRapida as we now handle it inside handleCreate

  const handleCambiarEstado = async (rep: any, nuevoEstado: string) => {
    if (nuevoEstado === 'presupuestado') {
      setReparacionAPresupuestar(rep);
      return;
    }

    try {
      await api.cambiarEstadoReparacion(rep.id, nuevoEstado);
      if (detalle && detalle.id === rep.id) {
        const updated = await api.getReparacion(rep.id);
        setDetalle(updated);
      }
      loadReparaciones();
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const openDetalle = async (id: string) => {
    try {
      const rep = await api.getReparacion(id);
      setDetalle(rep);
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

  const getEstadoConfig = (estado: string) =>
    estadoReparacion[estado as keyof typeof estadoReparacion] || { label: estado, color: '#666', icon: '❓' };

  const getNextEstado = (estado: string): string | null => {
    const transitions: Record<string, string> = {
      recibido: 'presupuestado',
      presupuestado: 'en_proceso',
      en_proceso: 'listo',
      listo: 'entregado',
    };
    return transitions[estado] || null;
  };

  const selectedClientMotos = form.clienteId
    ? clientes.find((c: any) => c.id === form.clienteId)?.motos || []
    : anonMotos;

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.dni && c.dni.includes(clientSearch))
  );

  const setHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setFiltroFechaInicio(hoy);
    setFiltroFechaFin(hoy);
    setCurrentPage(1);
  };

  const limpiarFiltros = () => {
    setFiltroEstado('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔧 Reparaciones</h1>
          <p className="page-subtitle">Gestión del taller</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nueva Reparación
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="tabs">
          <button className={`tab ${filtroEstado === '' ? 'active' : ''}`} onClick={() => { setFiltroEstado(''); setCurrentPage(1); }}>
            Todas
          </button>
          {Object.entries(estadoReparacion).map(([key, val]) => (
            <button key={key} className={`tab ${filtroEstado === key ? 'active' : ''}`} onClick={() => { setFiltroEstado(key); setCurrentPage(1); }}>
              {val.icon} {val.label}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 text-sm bg-card p-2 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground font-medium">Desde:</label>
            <input 
              type="date" 
              className="input py-1 px-2 text-sm h-8"
              value={filtroFechaInicio}
              onChange={(e) => { setFiltroFechaInicio(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground font-medium">Hasta:</label>
            <input 
              type="date" 
              className="input py-1 px-2 text-sm h-8"
              value={filtroFechaFin}
              onChange={(e) => { setFiltroFechaFin(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 ml-2 border-l border-border pl-2">
            <button className="btn btn-secondary btn-sm h-8" onClick={setHoy}>Hoy</button>
            <button className="btn btn-outline btn-sm h-8 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de reparaciones (Grid de Tarjetas) */}
      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reparaciones.map(rep => {
              const estadoConf = getEstadoConfig(rep.estado);
              const nextEstado = getNextEstado(rep.estado);
              const marcaModelo = rep.moto ? `${rep.moto.marca || ''} ${rep.moto.modelo || ''}`.trim() : 'Moto sin especificar';
              const totalMonto = rep.totalRepuestos + rep.totalManoObra;

              return (
                <div 
                  key={rep.id} 
                  className="card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer p-4 mb-0"
                  onClick={() => openDetalle(rep.id)}
                >
                  <div>
                    {/* Header: Marca/Modelo + Estado */}
                    <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-border">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-foreground truncate leading-tight">
                          {marcaModelo}
                        </h3>
                        {rep.moto?.dominio && (
                          <span className="text-xs font-mono text-muted-foreground block mt-0.5">
                            Patente: {rep.moto.dominio}
                          </span>
                        )}
                      </div>
                      <span 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                        style={{
                          background: `${estadoConf.color}15`,
                          color: estadoConf.color,
                          border: `1px solid ${estadoConf.color}35`
                        }}
                      >
                        <span>{estadoConf.icon}</span>
                        <span>{estadoConf.label}</span>
                      </span>
                    </div>

                    {/* Detalle Info */}
                    <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center justify-between">
                        <span>Cliente:</span>
                        <span className="font-medium text-foreground truncate max-w-[150px]">
                          {rep.moto?.cliente?.nombre || 'Consumidor final'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Ingreso:</span>
                        <span className="font-medium text-foreground">
                          {new Date(rep.fechaIngreso).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      {rep.descripcionProblema && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 bg-secondary/40 p-2 rounded-md border border-border/50">
                          "{rep.descripcionProblema}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer: Total & Acción */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Total</span>
                      <span className="font-mono text-base font-bold text-foreground">
                        {formatCurrency(totalMonto)}
                      </span>
                    </div>
                    {nextEstado ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleCambiarEstado(rep, nextEstado); }}
                      >
                        → {getEstadoConfig(nextEstado).label}
                      </button>
                    ) : (
                      <span className="text-xs text-success font-semibold flex items-center gap-1">
                        ✓ Entregada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {reparaciones.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">🔧</span>
              <span className="empty-state-title">No hay reparaciones</span>
              <span className="empty-state-text">No se encontraron reparaciones registradas con este filtro</span>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground">
                Página {currentPage} de {totalPages} · ({totalItems} reparaciones en total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  ← Anterior
                </button>
                <span className="text-xs font-semibold text-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detalle Modal */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {detalle.moto?.marca} {detalle.moto?.modelo} — {detalle.moto?.dominio}
              </h2>
              <button className="modal-close" onClick={() => setDetalle(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="mb-md">
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-xs">Problema reportado</div>
                <p className="text-sm font-medium text-foreground bg-secondary/50 p-3 rounded-lg border border-border">{detalle.descripcionProblema}</p>
              </div>

              <div className="mb-md">
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-xs">Historial de Estados</div>
                <div className="timeline">
                  {detalle.estadoHistorial?.map((h: any, i: number) => {
                    const conf = getEstadoConfig(h.estado);
                    return (
                      <div key={i} className={`timeline-item ${i === detalle.estadoHistorial.length - 1 ? 'active' : 'completed'}`}>
                        <div className="timeline-date">{new Date(h.fechaHora).toLocaleString('es-AR')}</div>
                        <div className="timeline-title">{conf.icon} {conf.label}</div>
                        {h.observaciones && <div className="text-sm text-secondary">{h.observaciones}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {detalle.repuestosUsados?.length > 0 && (
                <div className="mb-md">
                  <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-xs">Repuestos</div>
                  <div className="table-container mb-0">
                    <table>
                      <thead><tr><th>Repuesto</th><th>Cant.</th><th style={{ textAlign: 'right' }}>Precio</th></tr></thead>
                      <tbody>
                        {detalle.repuestosUsados.map((r: any, i: number) => (
                          <tr key={i}>
                            <td className="font-medium">{r.producto?.nombre || '-'}</td>
                            <td>{r.cantidad}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(r.precioUnitarioCongelado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer justify-between">
              <div>
                <div className="text-lg font-bold text-foreground">Total: {formatCurrency(detalle.totalRepuestos + detalle.totalManoObra)}</div>
                <div className="text-xs text-secondary">
                  (Repuestos: {formatCurrency(detalle.totalRepuestos)} + M.O.: {formatCurrency(detalle.totalManoObra)})
                </div>
              </div>
              <div className="flex gap-sm">
                {detalle.estado !== 'recibido' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => generarPDFPresupuesto(detalle)}
                  >
                    📄 PDF Presupuesto
                  </button>
                )}
                {detalle.estado === 'recibido' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setReparacionAPresupuestar(detalle);
                      setDetalle(null);
                    }}
                  >
                    📝 Cargar Presupuesto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nueva Reparación Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ overflowY: 'auto', alignItems: 'flex-start', padding: '2rem 1rem' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ overflow: 'visible', margin: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Nueva Reparación</h2>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ overflow: 'visible' }}>
              <div className="modal-body" style={{ overflowY: 'visible', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0, position: 'relative', zIndex: 30 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="form-label" style={{ margin: 0 }}>Cliente</span>
                    {!showNuevoCliente && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNuevoCliente(true)}>+ Nuevo</button>
                    )}
                  </div>
                  {showNuevoCliente ? (
                    <div style={{ border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-secondary, #f9fafb)' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nombre y Apellido *"
                        value={nuevoClienteForm.nombre}
                        onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, nombre: e.target.value })}
                        autoFocus
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="DNI (opcional)"
                          value={nuevoClienteForm.dni}
                          onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, dni: e.target.value })}
                        />
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Teléfono (opcional)"
                          value={nuevoClienteForm.telefono}
                          onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, telefono: e.target.value })}
                        />
                      </div>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Email (opcional)"
                        value={nuevoClienteForm.email}
                        onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, email: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Dirección (opcional)"
                        value={nuevoClienteForm.direccion}
                        onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, direccion: e.target.value })}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowNuevoCliente(false); setNuevoClienteForm({ nombre: '', dni: '', telefono: '', email: '', direccion: '' }); }}>Cancelar</button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateClienteRapido}>Guardar Cliente</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Buscar cliente..."
                        value={
                          form.clienteId 
                            ? clientes.find((c: any) => c.id === form.clienteId)?.nombre || ''
                            : clientSearch
                        }
                        onChange={e => {
                          setForm({ ...form, clienteId: '', motoId: '' });
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => {
                          if (form.clienteId) {
                            setForm({ ...form, clienteId: '', motoId: '' });
                            setClientSearch(clientes.find((c: any) => c.id === form.clienteId)?.nombre || '');
                          }
                          setShowClientDropdown(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowClientDropdown(false), 200);
                        }}
                      />
                      {showClientDropdown && clientSearch.trim().length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50 divide-y divide-border">
                          {filteredClientes.map((c: any) => (
                            <div 
                              key={c.id}
                              className="p-3 flex justify-between items-center cursor-pointer hover:bg-secondary/40 transition-colors"
                              onMouseDown={() => {
                                setForm({ ...form, clienteId: c.id, motoId: '' });
                                setClientSearch('');
                                setShowClientDropdown(false);
                              }}
                            >
                              <span className="font-semibold">{c.nombre}</span> <span className="text-xs text-muted-foreground">{c.dni ? `DNI: ${c.dni}` : ''}</span>
                            </div>
                          ))}
                          {filteredClientes.length === 0 && (
                            <div className="p-3 text-sm text-muted-foreground">
                              No se encontraron clientes
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 0, position: 'relative', zIndex: 20 }}>
                  <label className="form-label mb-sm">Vehículo</label>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                      <div className="search-input-wrapper" style={{ flex: '1 1 30%', marginBottom: 0, position: 'relative', zIndex: 60 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Marca"
                          value={nuevaMotoForm.marca}
                          onChange={e => { setNuevaMotoForm({ ...nuevaMotoForm, marca: e.target.value }); setShowMarcaDropdown(true); }}
                          onFocus={() => setShowMarcaDropdown(true)}
                          onBlur={() => setTimeout(() => setShowMarcaDropdown(false), 200)}
                          required
                        />
                        {showMarcaDropdown && nuevaMotoForm.marca && Array.from(new Set(modelosMotos.map(m => m.marca))).filter(marca => marca.toLowerCase().includes(nuevaMotoForm.marca.toLowerCase())).length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-[100] divide-y divide-border">
                            {Array.from(new Set(modelosMotos.map(m => m.marca)))
                              .filter(marca => marca.toLowerCase().includes(nuevaMotoForm.marca.toLowerCase()))
                              .map(marca => (
                              <div 
                                key={marca} 
                                className="p-3 flex justify-between items-center cursor-pointer hover:bg-secondary/40 transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setNuevaMotoForm({ ...nuevaMotoForm, marca: marca });
                                  setShowMarcaDropdown(false);
                                }}
                              >
                                <span className="font-semibold">{marca}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="search-input-wrapper" style={{ flex: '1 1 30%', marginBottom: 0, position: 'relative', zIndex: 50 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Modelo"
                          value={nuevaMotoForm.modelo}
                          onChange={e => { setNuevaMotoForm({ ...nuevaMotoForm, modelo: e.target.value }); setShowModeloDropdown(true); }}
                          onFocus={() => setShowModeloDropdown(true)}
                          onBlur={() => setTimeout(() => setShowModeloDropdown(false), 200)}
                          required
                        />
                        {showModeloDropdown && nuevaMotoForm.modelo && modelosMotos.filter(m => (!nuevaMotoForm.marca || m.marca === nuevaMotoForm.marca) && m.modelo.toLowerCase().includes(nuevaMotoForm.modelo.toLowerCase())).length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-[100] divide-y divide-border">
                            {modelosMotos
                              .filter(m => (!nuevaMotoForm.marca || m.marca === nuevaMotoForm.marca) && m.modelo.toLowerCase().includes(nuevaMotoForm.modelo.toLowerCase()))
                              .map(m => (
                                <div 
                                  key={`${m.marca}-${m.modelo}`} 
                                  className="p-3 flex justify-between items-center cursor-pointer hover:bg-secondary/40 transition-colors"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setNuevaMotoForm({ ...nuevaMotoForm, modelo: m.modelo, marca: m.marca });
                                    setShowModeloDropdown(false);
                                  }}
                                >
                                  <span className="font-semibold">{m.modelo}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: '1 1 30%', position: 'relative', zIndex: 40 }}
                        placeholder="Patente (Opcional)"
                        value={nuevaMotoForm.dominio}
                        onChange={e => setNuevaMotoForm({ ...nuevaMotoForm, dominio: e.target.value.toUpperCase() })}
                      />
                    </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0, position: 'relative', zIndex: 10 }}>
                  <label className="form-label">Descripción del Problema</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={form.descripcionProblema}
                    onChange={e => setForm({ ...form, descripcionProblema: e.target.value })}

                  required
                  placeholder="Describe el problema reportado por el cliente..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={!nuevaMotoForm.marca || !nuevaMotoForm.modelo || !form.descripcionProblema.trim()}>Crear Reparación</button>
            </div>
            </form>
          </div>
        </div>
      )}
      {/* Presupuesto Modal */}
      {reparacionAPresupuestar && (
        <PresupuestoModal
          reparacion={reparacionAPresupuestar}
          onClose={() => setReparacionAPresupuestar(null)}
          onSuccess={() => {
            setReparacionAPresupuestar(null);
            loadReparaciones();
            if (detalle && detalle.id === reparacionAPresupuestar.id) {
              openDetalle(reparacionAPresupuestar.id);
            }
          }}
        />
      )}
    </div>
  );
}

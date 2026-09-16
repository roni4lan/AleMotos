// ============================================
// Ale Motos — Clientes Page
// ============================================

import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api';
import { useDialog } from '../../shared/components/DialogProvider';

export function ClientesPage() {
  const { showAlert, showConfirm } = useDialog();
  const [clientes, setClientes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ dni: '', nombre: '', telefono: '', email: '', direccion: '' });

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q) params.search = q;
      const result = await api.getClientes(params);
      setClientes(result?.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load(debouncedSearch);
  }, [debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await api.updateCliente(editing.id, form); }
      else { await api.createCliente(form); }
      setShowModal(false); setEditing(null); setForm({ dni: '', nombre: '', telefono: '', email: '', direccion: '' }); load(search);
    } catch (err: any) { showAlert(err.message); }
  };

  const handleEdit = (c: any) => {
    setEditing(c); setForm({ dni: c.dni, nombre: c.nombre, telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || '' }); setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await showConfirm('¿Estás seguro de que deseas eliminar este cliente?', 'Eliminar Cliente');
    if (!ok) return;
    try { await api.deleteCliente(id); load(search); } catch (err: any) { showAlert(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">👥 Clientes</h1></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ dni: '', nombre: '', telefono: '', email: '', direccion: '' }); setShowModal(true); }}>+ Nuevo Cliente</button>
      </div>
      <div className="search-input-wrapper" style={{ marginBottom: 'var(--sp-lg)', maxWidth: '400px' }}>
        <span className="search-icon">🔍</span>
        <input className="form-input" placeholder="Buscar por nombre, DNI o teléfono..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="loading-container"><div className="loading-spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>DNI</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Motos</th><th>Acciones</th></tr></thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td><code style={{ color: 'var(--accent-secondary)' }}>{c.dni}</code></td>
                  <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                  <td className="text-secondary">{c.telefono || '-'}</td>
                  <td className="text-secondary">{c.email || '-'}</td>
                  <td>{c.motos?.map((m: any) => <span key={m.id} className="badge badge-neutral" style={{ marginRight: 4 }}>{m.marca} {m.modelo}</span>)}</td>
                  <td>
                    <div className="flex gap-xs">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && <tr><td colSpan={6}><div className="empty-state"><span className="empty-state-icon">👥</span><span className="empty-state-title">No hay clientes</span></div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">DNI</label><input className="form-input" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Nombre</label><input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Teléfono</label><input className="form-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Dirección</label><input className="form-input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary">{editing ? 'Guardar' : 'Crear'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Ale Motos — Proveedores Page
// ============================================

import React, { useState, useEffect } from 'react';
import { api } from '../../shared/api';
import { useDialog } from '../../shared/components/DialogProvider';

export function ProveedoresPage() {
  const { showAlert, showConfirm } = useDialog();
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  
  const [form, setForm] = useState({
    nombre: '', cuit: '', telefono: '', email: '', direccion: '', notas: ''
  });

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q) params.search = q;
      const result = await api.getProveedores(params);
      setProveedores(result?.data || []);
    } catch (err) {
      console.error(err);
    }
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
      if (editing) {
        await api.updateProveedor(editing.id, form);
      } else {
        await api.createProveedor(form);
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      cuit: p.cuit || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
      notas: p.notas || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await showConfirm('¿Estás seguro de que deseas eliminar este proveedor?', 'Eliminar Proveedor');
    if (!ok) return;
    try {
      await api.deleteProveedor(id);
      load();
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', cuit: '', telefono: '', email: '', direccion: '', notas: '' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏭 Proveedores</h1>
          <p className="page-subtitle">Gestión de proveedores de repuestos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}>
          + Nuevo Proveedor
        </button>
      </div>

      <div className="search-input-wrapper" style={{ marginBottom: 'var(--sp-lg)', maxWidth: '400px' }}>
        <span className="search-icon">🔍</span>
        <input 
          className="form-input" 
          placeholder="Buscar proveedor..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>CUIT</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td><code className="text-secondary">{p.cuit || '-'}</code></td>
                  <td>
                    <div className="text-sm">{p.telefono || '-'}</div>
                    <div className="text-sm text-secondary">{p.email}</div>
                  </td>
                  <td className="text-secondary">{p.direccion || '-'}</td>
                  <td>
                    <div className="flex gap-xs">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <span className="empty-state-icon">🏭</span>
                      <span className="empty-state-title">No hay proveedores</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre o Razón Social</label>
                <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CUIT (Opcional)</label>
                  <input className="form-input" value={form.cuit} onChange={e => setForm({ ...form, cuit: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input className="form-input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea className="form-input" rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

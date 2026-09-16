// ============================================
// Ale Motos — Header Component
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function Header({ title, onMenuToggle }: HeaderProps) {
  const isOnline = useOnlineStatus();
  const { user, logout } = useAuth();
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onQueued = (e: any) => setPendingSyncs(e.detail.count);
    const onCompleted = (e: any) => setPendingSyncs(e.detail.remaining);
    window.addEventListener('sync:queued', onQueued);
    window.addEventListener('sync:completed', onCompleted);
    return () => {
      window.removeEventListener('sync:queued', onQueued);
      window.removeEventListener('sync:completed', onCompleted);
    };
  }, []);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const initials = user?.nombre
    ? user.nombre.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-burger" onClick={onMenuToggle}>☰</button>
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        {pendingSyncs > 0 && (
          <div className="badge badge-warning" style={{ marginRight: 'var(--sp-sm)', animation: 'pulse 2s infinite' }}>
            ⏳ {pendingSyncs} pendientes
          </div>
        )}

        <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
          <span>{isOnline ? '●' : '○'}</span>
          <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
        </div>

        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            {/* Avatar / botón */}
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-secondary, #f3f4f6)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '999px',
                padding: '0.3rem 0.75rem 0.3rem 0.3rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover, #e5e7eb)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-secondary, #f3f4f6)')}
            >
              {/* Círculo con iniciales */}
              <span style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: '#dc2626', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
              }}>
                {initials}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #111)' }}>
                {user.nombre}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #6b7280)', marginLeft: '2px' }}>
                {showUserMenu ? '▲' : '▼'}
              </span>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: '220px',
                background: '#fff',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '0.875rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                zIndex: 9999,
                animation: 'fadeInDown 0.15s ease',
              }}>
                {/* Info del usuario */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#dc2626', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                  }}>
                    {initials}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>{user.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>{user.rol}</div>
                    {user.email && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{user.email}</div>}
                  </div>
                </div>

                {/* Opción cerrar sesión */}
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.85rem 1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#dc2626',
                    transition: 'background 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseOut={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: '1.1rem' }}>🚪</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

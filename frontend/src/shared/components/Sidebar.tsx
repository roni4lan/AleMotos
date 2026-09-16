// ============================================
// Ale Motos — Sidebar Component
// ============================================

import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BUSINESS_NAME } from '../../theme';
import { api } from '../api';
import logo from '../../assets/logo.png';
import { LayoutDashboard, ShoppingCart, Wrench, Package, Users, Factory, BadgeDollarSign, Globe } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  alertCount?: number;
}

const navItems = [
  { section: 'Principal', items: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Operaciones', items: [
    { path: '/ventas', icon: ShoppingCart, label: 'Ventas (POS)' },
    { path: '/reparaciones', icon: Wrench, label: 'Reparaciones' },
  ]},
  { section: 'Gestión', items: [
    { path: '/stock', icon: Package, label: 'Stock' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/proveedores', icon: Factory, label: 'Proveedores' },
  ]},
  { section: 'Reportes', items: [
    { path: '/finanzas', icon: BadgeDollarSign, label: 'Finanzas' },
  ]},
];

export function Sidebar({ isOpen, onClose, alertCount }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearToken } = api;

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} 
        onClick={onClose} 
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ padding: '1rem', height: 'auto' }}>
          <img src={logo} alt="Ale Motos Logo" className="w-12 h-12 object-contain" />
          <div className="flex flex-col">
            <span className="sidebar-logo-text" style={{ fontSize: '1.25rem' }}>{BUSINESS_NAME}</span>
            <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider font-semibold">Gestión integral</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(section => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `sidebar-link relative overflow-hidden transition-all duration-200 ease-in-out ${isActive && (item.path === '/' ? location.pathname === '/' : true) ? 'active bg-red-50 text-[#dc2626]' : 'hover:bg-muted/50'}`
                  }
                  onClick={onClose}
                  end={item.path === '/'}
                >
                  {({ isActive }) => (
                    <>
                      {(isActive && (item.path === '/' ? location.pathname === '/' : true)) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#dc2626] shadow-[2px_0_8px_rgba(220,38,38,0.5)]"></div>
                      )}
                      <span className="sidebar-link-icon flex items-center justify-center opacity-80">
                        <item.icon size={20} strokeWidth={isActive && (item.path === '/' ? location.pathname === '/' : true) ? 2 : 1.5} />
                      </span>
                      <span className={isActive && (item.path === '/' ? location.pathname === '/' : true) ? 'font-semibold' : 'font-medium'}>{item.label}</span>
                  {item.path === '/stock' && alertCount && alertCount > 0 && (
                    <span className="sidebar-badge">{alertCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
          
          <div className="sidebar-section" style={{ marginTop: 'auto' }}>
            <div className="sidebar-section-title">Público</div>
            <NavLink
              to="/portal"
              className={({ isActive }) => `sidebar-link relative overflow-hidden transition-all duration-200 ease-in-out ${isActive ? 'active bg-red-50 text-[#dc2626]' : 'hover:bg-muted/50'}`}
              onClick={onClose}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#dc2626] shadow-[2px_0_8px_rgba(220,38,38,0.5)]"></div>
                  )}
                  <span className="sidebar-link-icon flex items-center justify-center opacity-80">
                    <Globe size={20} strokeWidth={isActive ? 2 : 1.5} />
                  </span>
                  <span className={isActive ? 'font-semibold' : 'font-medium'}>Portal Cliente</span>
                </>
              )}
            </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
}

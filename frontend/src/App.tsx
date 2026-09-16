// ============================================
// Ale Motos — Main App & Router
// ============================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/hooks/useAuth';

// Layout Components
import { AppShell } from '@/components/app-shell';
import { LoginPage } from './shared/components/LoginPage';

// Pages
import { FinanzasPage } from './modules/finanzas/FinanzasPage';
import { DashboardPage } from './modules/finanzas/DashboardPage';
import { StockPage } from './modules/stock/StockPage';
import { VentasPage } from './modules/ventas/VentasPage';
import { ReparacionesPage } from './modules/reparaciones/ReparacionesPage';
import { ClientesPage } from './modules/clientes/ClientesPage';
import { ProveedoresPage } from './modules/proveedores/ProveedoresPage';
import { PortalClientePage } from './modules/portal-cliente/PortalClientePage';

// Removed MainLayout since we use AppShell

// Private Route Guard
function PrivateRoute({ children, title }: { children: React.ReactNode; title: string }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

// App Root
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portal" element={<PortalClientePage />} />

        {/* Rutas Privadas */}
        <Route path="/" element={<PrivateRoute title="Dashboard"><DashboardPage /></PrivateRoute>} />
        <Route path="/finanzas" element={<PrivateRoute title="Finanzas"><FinanzasPage /></PrivateRoute>} />
        <Route path="/stock" element={<PrivateRoute title="Stock"><StockPage /></PrivateRoute>} />
        <Route path="/ventas" element={<PrivateRoute title="Ventas"><VentasPage /></PrivateRoute>} />
        <Route path="/reparaciones" element={<PrivateRoute title="Reparaciones"><ReparacionesPage /></PrivateRoute>} />
        <Route path="/clientes" element={<PrivateRoute title="Clientes"><ClientesPage /></PrivateRoute>} />
        <Route path="/proveedores" element={<PrivateRoute title="Proveedores"><ProveedoresPage /></PrivateRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar'
import { TopBar } from '@/components/top-bar'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/ventas': 'Ventas',
  '/reparaciones': 'Reparaciones',
  '/stock': 'Stock',
  '/clientes': 'Clientes',
  '/proveedores': 'Proveedores',
  '/finanzas': 'Finanzas',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const key = Object.keys(titles)
    .filter((k) => (k === '/' ? pathname === '/' : pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0]
  const title = titles[key] ?? 'Ale Motos'

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

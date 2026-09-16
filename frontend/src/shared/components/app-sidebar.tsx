import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils'
import logo from '../../assets/logo.png';
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Package,
  Users,
  Factory,
  Wallet,
  Globe,
  Bike,
  X,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ElementType }
type NavSection = { title: string; items: NavItem[] }

const sections: NavSection[] = [
  {
    title: 'Principal',
    items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Operaciones',
    items: [
      { href: '/ventas', label: 'Ventas (POS)', icon: ShoppingCart },
      { href: '/reparaciones', label: 'Reparaciones', icon: Wrench },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { href: '/stock', label: 'Stock', icon: Package },
      { href: '/clientes', label: 'Clientes', icon: Users },
      { href: '/proveedores', label: 'Proveedores', icon: Factory },
    ],
  },
  {
    title: 'Reportes',
    items: [{ href: '/finanzas', label: 'Finanzas', icon: Wallet }],
  },
  {
    title: 'Público',
    items: [{ href: '/portal', label: 'Portal Cliente', icon: Globe }],
  },
]

export function AppSidebar({
  open,
  onClose,
}: {
  open?: boolean
  onClose?: () => void
}) {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 border-r border-sidebar-border',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-5">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <img src={logo} alt="Ale Motos Logo" className="size-9 rounded-xl object-contain shadow-md" />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-white">
                Ale Motos
              </span>
              <span className="text-[11px] font-medium text-sidebar-foreground/60">Gestión integral</span>
            </span>
          </Link>
          <button
            className="text-sidebar-foreground/70 hover:text-white md:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          active
                            ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-white font-semibold border border-primary/30'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                        )}
                      >
                        <Icon
                          className={cn(
                            'size-[18px] shrink-0 transition-colors',
                            active ? 'text-primary' : 'text-sidebar-foreground/70 group-hover:text-white',
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {active && (
                          <span className="h-4 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-3 text-[11px] text-sidebar-foreground/40 font-medium">
          Ale Motos · v1.0
        </div>
      </aside>
    </>
  )
}

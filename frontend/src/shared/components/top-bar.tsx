import { useState, useRef, useEffect } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../hooks/useAuth'

export function TopBar({
  title,
  onMenu,
}: {
  title: string
  onMenu?: () => void
}) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cierra al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const initials = user?.nombre
    ? user.nombre.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A'

  const nombre = user?.nombre ?? 'Administrador'
  const rol = user?.rol ?? ''
  const email = user?.email ?? ''

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onMenu}
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador online */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <span className="size-2 rounded-full bg-success" />
          En línea
        </span>

        {/* Avatar + dropdown */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 rounded-full border border-border bg-secondary/80 py-1 pl-1 pr-3 shadow-2xs transition-colors hover:bg-secondary"
            style={{ cursor: 'pointer', background: 'none' }}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </span>
            <span className="text-sm font-semibold text-foreground">{nombre}</span>
            <span style={{ fontSize: '0.6rem', color: '#9ca3af', marginLeft: '2px' }}>
              {open ? '▲' : '▼'}
            </span>
          </button>

          {/* Dropdown menu */}
          {open && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                minWidth: '230px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.875rem',
                boxShadow: '0 12px 32px rgba(0,0,0,0.13)',
                overflow: 'hidden',
                zIndex: 9999,
              }}
            >
              {/* Info del usuario */}
              <div style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: '#dc2626', color: '#fff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1rem',
                }}>
                  {initials}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{nombre}</div>
                  {rol && <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>{rol}</div>}
                  {email && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '1px' }}>{email}</div>}
                </div>
              </div>

              {/* Cerrar sesión */}
              <button
                onClick={() => { setOpen(false); logout(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.875rem 1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#dc2626',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#fef2f2')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

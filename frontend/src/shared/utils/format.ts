export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0)
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0)
  return new Intl.NumberFormat('es-AR').format(Number.isFinite(n) ? n : 0)
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function num(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : (value ?? 0)
  return Number.isFinite(n) ? n : 0
}

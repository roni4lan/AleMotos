export const REPAIR_STATUSES = [
  'Recibida',
  'En reparación',
  'Lista para entregar',
  'Entregada',
] as const

export type RepairStatus = (typeof REPAIR_STATUSES)[number]

export function repairStatusVariant(
  status: string,
): 'default' | 'neutral' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'Lista para entregar':
      return 'success'
    case 'En reparación':
      return 'warning'
    case 'Entregada':
      return 'neutral'
    default:
      return 'default'
  }
}

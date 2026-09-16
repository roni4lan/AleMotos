import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { ElementType } from 'react'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  icon: ElementType
  tone?: 'default' | 'success' | 'warning' | 'destructive'
}) {
  return (
    <Card 
      className="p-6 transition-all duration-200 ease-in-out hover:-translate-y-[2px] hover:shadow-md"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-mono text-3xl font-black tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p>}
        </div>
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#fef2f2] text-[#dc2626]"
        >
          <Icon className="size-6 stroke-[1.5]" />
        </span>
      </div>
    </Card>
  )
}

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          'flex h-9 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-sm shadow-sm transition-colors',
          'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }

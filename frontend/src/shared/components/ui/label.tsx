import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn(
        'text-sm font-medium leading-none text-foreground select-none',
        className,
      )}
      {...props}
    />
  )
}

export { Label }

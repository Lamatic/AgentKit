'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  max = 100,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const safeMax = typeof max === 'number' && max > 0 ? max : 100
  const safeValue =
    typeof value === 'number' ? Math.min(Math.max(value, 0), safeMax) : null
  const percentage = safeValue === null ? 0 : (safeValue / safeMax) * 100

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={safeValue ?? undefined}
      max={safeMax}
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

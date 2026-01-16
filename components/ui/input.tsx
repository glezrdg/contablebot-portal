import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-xs transition-glass outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        default: [
          'bg-transparent',
          'dark:bg-input/30',
          'border',
          'border-input',
          'focus-visible:border-ring',
          'focus-visible:ring-ring/50',
          'focus-visible:ring-[3px]',
        ],
        glass: [
          'bg-[var(--glass-white)]',
          'backdrop-blur-md',
          'border',
          'border-[var(--glass-border)]',
          'shadow-[var(--glass-shadow)]',
          'focus-visible:border-primary/50',
          'focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]',
          'focus-visible:backdrop-blur-lg',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface InputProps
  extends React.ComponentProps<'input'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          inputVariants({ variant }),
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }

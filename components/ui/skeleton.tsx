import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-muted/50",
        glass: "bg-[var(--glass-white)] border border-[var(--glass-border)]",
        shimmer: [
          "bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50",
          "bg-[length:200%_100%]",
          "animate-shimmer",
        ],
      },
    },
    defaultVariants: {
      variant: "glass",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  variant,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

// Preset skeleton components for common use cases
function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      variant="glass"
      className={cn("h-32 w-full rounded-xl", className)}
      {...props}
    />
  )
}

function SkeletonTable({ rows = 5, ...props }: React.HTMLAttributes<HTMLDivElement> & { rows?: number }) {
  return (
    <div className="space-y-2" {...props}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="glass"
          className="h-12 w-full rounded-lg"
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn("h-12 w-12 rounded-full", className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonAvatar, skeletonVariants }

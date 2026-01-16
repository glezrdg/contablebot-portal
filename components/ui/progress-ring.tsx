import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressRingVariants = cva(
  "relative inline-flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "w-16 h-16",
        md: "w-24 h-24",
        lg: "w-32 h-32",
        xl: "w-40 h-40",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface ProgressRingProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof progressRingVariants> {
  value: number // 0-100
  max?: number
  showLabel?: boolean
  label?: string
  strokeWidth?: number
  animate?: boolean
  glowEffect?: boolean
}

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      className,
      size,
      value,
      max = 100,
      showLabel = true,
      label,
      strokeWidth = 8,
      animate = true,
      glowEffect = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    // Calculate size values
    const sizeMap = {
      sm: 64,
      md: 96,
      lg: 128,
      xl: 160,
    }
    const pixelSize = sizeMap[size || "md"]
    const center = pixelSize / 2
    const radius = center - strokeWidth / 2 - 4
    const circumference = 2 * Math.PI * radius

    // Calculate stroke dash offset for the progress
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    // Determine color based on percentage
    const getColorClass = () => {
      if (percentage >= 90) return "text-destructive"
      if (percentage >= 75) return "text-yellow-500"
      if (percentage >= 50) return "text-primary"
      return "text-green-500"
    }

    const colorClass = getColorClass()

    return (
      <div
        ref={ref}
        className={cn(progressRingVariants({ size, className }))}
        {...props}
      >
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox={`0 0 ${pixelSize} ${pixelSize}`}
          className="transform -rotate-90"
        >
          {/* Background circle with glass effect */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-50"
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              colorClass,
              animate && "transition-all duration-1000 ease-out",
              glowEffect && percentage >= 75 && "drop-shadow-[0_0_8px_currentColor]"
            )}
            style={{
              filter: glowEffect && percentage >= 75 ? "drop-shadow(0 0 4px currentColor)" : undefined,
            }}
          />
        </svg>

        {/* Center label with glass background */}
        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={cn(
                "rounded-full bg-[var(--glass-white)] backdrop-blur-sm",
                "border border-[var(--glass-border)]",
                "px-3 py-1.5",
                "shadow-sm"
              )}
            >
              <span className={cn("font-semibold tabular-nums", colorClass)}>
                {label !== undefined ? label : `${Math.round(percentage)}%`}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
)
ProgressRing.displayName = "ProgressRing"

// Preset component for usage stats
interface UsageRingProps extends Omit<ProgressRingProps, "value" | "max"> {
  used: number
  limit: number
}

const UsageRing = React.forwardRef<HTMLDivElement, UsageRingProps>(
  ({ used, limit, ...props }, ref) => {
    const percentage = (used / limit) * 100

    return (
      <ProgressRing
        ref={ref}
        value={used}
        max={limit}
        label={`${used}/${limit}`}
        glowEffect
        {...props}
      />
    )
  }
)
UsageRing.displayName = "UsageRing"

export { ProgressRing, UsageRing, progressRingVariants }

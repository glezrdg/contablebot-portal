import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassCardVariants = cva(
  "backdrop-blur-md transition-glass",
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--glass-white)]",
          "border border-[var(--glass-border)]",
          "shadow-[var(--glass-shadow)]",
        ],
        elevated: [
          "bg-[var(--glass-white)]",
          "border border-[var(--glass-border)]",
          "shadow-lg",
        ],
        bordered: [
          "bg-[var(--glass-white)]",
          "border-2 border-transparent",
          "bg-clip-padding",
          "[background-image:var(--primary-gradient)]",
          "shadow-[var(--glass-shadow)]",
        ],
        flat: [
          "bg-[var(--glass-white)]",
          "border border-[var(--glass-border)]",
        ],
        "3d": [
          "bg-[var(--glass-white)]",
          "border border-[var(--glass-border)]",
          "shadow-[0_8px_32px_0_rgba(31,38,135,0.15),0_4px_16px_0_rgba(31,38,135,0.1),inset_0_1px_0_0_rgba(255,255,255,0.5)]",
          "dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4),0_4px_16px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
          "relative",
          "before:absolute",
          "before:inset-0",
          "before:rounded-[inherit]",
          "before:bg-gradient-to-b",
          "before:from-white/20",
          "before:to-transparent",
          "before:pointer-events-none",
          "before:z-[-1]",
        ],
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      },
      hover: {
        none: "",
        lift: "hover-lift hover:shadow-lg",
        glow: "hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]",
        scale: "hover:scale-[1.02] transition-transform",
        "3d": "hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25),0_6px_24px_0_rgba(31,38,135,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.5),0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:translate-y-[-6px] transition-all duration-300",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "xl",
      hover: "none",
    },
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, rounded, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, rounded, hover, className }))}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard, glassCardVariants }

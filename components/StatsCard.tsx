"use client"

import { LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  iconBgColor?: string
  iconColor?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  animate?: boolean
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = "bg-primary/20",
  iconColor = "text-primary",
  trend,
  animate = true,
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState<number>(0)
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0
  const isNumeric = typeof value === "number" || !isNaN(numericValue)

  // Animated counter effect
  useEffect(() => {
    if (!animate || !isNumeric) {
      return
    }

    const duration = 1000 // 1 second
    const steps = 60
    const increment = numericValue / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setDisplayValue(numericValue)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [numericValue, animate, isNumeric])

  const finalValue = animate && isNumeric ? displayValue : value

  return (
    <GlassCard
      variant="default"
      hover="lift"
      className="p-6 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        {/* Icon with gradient background */}
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${iconBgColor} backdrop-blur-sm shadow-sm`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      </div>

      <div className="space-y-1">
        {/* Animated value */}
        <p className="text-3xl font-bold text-foreground tabular-nums">
          {finalValue}
        </p>

        {/* Trend or subtitle */}
        {trend ? (
          <div className="flex items-center gap-2 transition-smooth">
            {trend.isPositive ? (
              <>
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <p className="text-sm text-emerald-500 font-medium">
                  +{trend.value}% {trend.label}
                </p>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
                <p className="text-sm text-destructive font-medium">
                  {trend.value}% {trend.label}
                </p>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </GlassCard>
  )
}

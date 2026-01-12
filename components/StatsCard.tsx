import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = "bg-primary/20",
  iconColor = "text-primary",
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {trend ? (
          <div className="flex items-center gap-2">
            {trend.isPositive ? (
              <>
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-sm text-emerald-500 font-medium">
                  +{trend.value}% {trend.label}
                </p>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
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
    </div>
  );
}

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: string; positive: boolean }
  alert?: boolean
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-gray-600',
  iconBg = 'bg-gray-100',
  trend,
  alert,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1', trend.positive ? 'text-green-600' : 'text-red-500')}>
              {trend.positive ? '+' : ''}{trend.value}
            </p>
          )}
          {subtitle && (
            <p className={cn('text-xs mt-1', alert ? 'text-red-500 font-medium' : 'text-gray-400')}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-full flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}

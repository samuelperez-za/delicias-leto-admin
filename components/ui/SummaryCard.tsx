import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: string
  variant?: 'default' | 'green' | 'red' | 'yellow' | 'blue'
}

const variantClasses = {
  default: 'bg-white border-gray-200',
  green: 'bg-green-50 border-green-200',
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  blue: 'bg-blue-50 border-blue-200',
}

const iconBgClasses = {
  default: 'bg-gray-100',
  green: 'bg-green-100',
  red: 'bg-red-100',
  yellow: 'bg-yellow-100',
  blue: 'bg-blue-100',
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: SummaryCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-5 flex items-start gap-4',
      variantClasses[variant]
    )}>
      {icon && (
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0', iconBgClasses[variant])}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
      </div>
    </div>
  )
}

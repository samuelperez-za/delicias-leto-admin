import type { BusinessAlert } from '@/types/database'

interface AlertBannerProps {
  alerts: BusinessAlert[]
}

const severityStyles = {
  critical: 'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-xl px-4 py-3 text-sm ${severityStyles[alert.severity]}`}
        >
          <p className="font-semibold">{alert.title}</p>
          <p className="mt-0.5 opacity-90">{alert.description}</p>
        </div>
      ))}
    </div>
  )
}

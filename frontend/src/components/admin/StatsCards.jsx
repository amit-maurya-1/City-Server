// src/components/admin/StatsCards.jsx
// Four stat cards shown at the top of the admin dashboard.

import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('700', '100')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

export default function StatsCards({ stats }) {
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={TrendingUp}
        label="Total Issues"
        value={stats.total}
        sub={`${stats.byStatus.reported} pending review`}
        color="text-gray-700"
      />
      <StatCard
        icon={CheckCircle2}
        label="Resolution Rate"
        value={`${stats.resolutionRate}%`}
        sub={`${stats.byStatus.resolved} resolved`}
        color="text-emerald-700"
      />
      <StatCard
        icon={Clock}
        label="Avg. Resolution"
        value={stats.avgResolutionDays ? `${stats.avgResolutionDays}d` : '—'}
        sub="average time to resolve"
        color="text-blue-700"
      />
      <StatCard
        icon={AlertTriangle}
        label="High Severity"
        value={stats.bySeverity.high}
        sub={`${stats.bySeverity.medium} medium, ${stats.bySeverity.low} low`}
        color="text-red-700"
      />
    </div>
  )
}

import type { Career } from '@/lib/types'

function formatDate(date: string | null) {
  if (!date) return '현재'
  const [year, month] = date.split('-')
  return `${year}년 ${month}월`
}

function calcDuration(start: string | null, end: string | null) {
  if (!start) return ''
  const s = new Date(start + 'T00:00:00')
  const e = end ? new Date(end + 'T00:00:00') : new Date()
  const months = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth()
  if (months <= 0) return '1개월 미만'
  const y = Math.floor(months / 12), m = months % 12
  return [y > 0 && `${y}년`, m > 0 && `${m}개월`].filter(Boolean).join(' ')
}

export default function PortfolioCareerCard({ career }: { career: Career }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-gray-900">{career.company}</div>
        <div className="text-xs text-indigo-600 font-medium">{career.role}</div>
        <div className="text-xs text-gray-400 mt-0.5">{formatDate(career.start_date)} — {formatDate(career.end_date)}</div>
      </div>
      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{calcDuration(career.start_date, career.end_date)}</span>
    </div>
  )
}

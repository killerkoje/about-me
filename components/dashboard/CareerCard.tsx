'use client'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Career } from '@/lib/types'
import { updateCareer, deleteCareer } from '@/app/(dashboard)/dashboard/career/actions'

function formatDate(date: string | null) {
  if (!date) return '현재'
  return new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' })
}

function calcDuration(start: string | null, end: string | null) {
  if (!start) return ''
  const s = new Date(start), e = end ? new Date(end) : new Date()
  const months = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth()
  const y = Math.floor(months / 12), m = months % 12
  return [y > 0 && `${y}년`, m > 0 && `${m}개월`].filter(Boolean).join(' ')
}

export default function CareerCard({ career }: { career: Career }) {
  const [editing, setEditing] = useState(false)
  const [company, setCompany] = useState(career.company)
  const [role, setRole] = useState(career.role)
  const [startDate, setStartDate] = useState(career.start_date ?? '')
  const [endDate, setEndDate] = useState(career.end_date ?? '')
  const [description, setDescription] = useState(career.description ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    try {
      await updateCareer(career.id, { company, role, start_date: startDate || null, end_date: endDate || null, description: description || null })
      setEditing(false)
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  if (editing) {
    return (
      <div className="bg-white border border-indigo-200 rounded-xl p-4 flex flex-col gap-3">
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="회사명 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="직책 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-gray-500 mb-1 block">입사일</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">퇴사일 (공백=현재)</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="담당 업무" rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5">취소</button>
          <button onClick={handleSave} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg">저장</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group hover:border-indigo-200 transition-colors flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900">{career.company}</div>
        <div className="text-xs text-indigo-600 font-medium">{career.role}</div>
        <div className="text-xs text-gray-400 mt-0.5">{formatDate(career.start_date)} — {formatDate(career.end_date)}</div>
      </div>
      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{calcDuration(career.start_date, career.end_date)}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil size={13} /></button>
        <button onClick={() => { if (confirm('경력을 삭제하시겠습니까?')) deleteCareer(career.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

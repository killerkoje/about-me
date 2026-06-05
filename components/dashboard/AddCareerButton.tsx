'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createCareer } from '@/app/(dashboard)/dashboard/career/actions'

export default function AddCareerButton() {
  const [open, setOpen] = useState(false)
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function handleClose() {
    setOpen(false)
    setCompany('')
    setRole('')
    setStartDate('')
    setEndDate('')
    setDescription('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await createCareer({ company, role, start_date: startDate || null, end_date: endDate || null, description: description || null })
      handleClose()
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setPending(false)
    }
  }

  if (open) return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={handleClose}>
      <form className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-3" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-gray-900 mb-1">경력 추가</h2>
        <input required value={company} onChange={e => setCompany(e.target.value)} placeholder="회사명 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <input required value={role} onChange={e => setRole(e.target.value)} placeholder="직책 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-gray-500 mb-1 block">입사일</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">퇴사일 (공백=현재)</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="담당 업무" rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={handleClose} className="text-sm text-gray-500 px-3 py-1.5">취소</button>
          <button type="submit" disabled={pending} className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50">저장</button>
        </div>
      </form>
    </div>
  )

  return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm">
      <Plus size={15} /> 추가
    </button>
  )
}

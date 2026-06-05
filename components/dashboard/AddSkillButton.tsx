'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createSkill } from '@/app/(dashboard)/dashboard/skills/actions'

export default function AddSkillButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState(50)
  const [category, setCategory] = useState<'language' | 'framework' | 'tool'>('language')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await createSkill({ name, level, category })
      setOpen(false)
      setName('')
      setLevel(50)
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  if (open) return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
      <form className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-gray-900 mb-4">스킬 추가</h2>
        <div className="flex flex-col gap-3">
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="스킬명 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <select value={category} onChange={e => setCategory(e.target.value as 'language' | 'framework' | 'tool')} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="language">언어</option>
            <option value="framework">프레임워크</option>
            <option value="tool">툴</option>
          </select>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">숙련도: {level}</label>
            <input type="range" min={1} max={100} value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full accent-indigo-600" />
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 px-3 py-1.5">취소</button>
            <button type="submit" className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg">저장</button>
          </div>
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

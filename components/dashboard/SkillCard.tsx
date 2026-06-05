'use client'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Skill } from '@/lib/types'
import { updateSkill, deleteSkill } from '@/app/(dashboard)/dashboard/skills/actions'

const categoryLabels = { language: '언어', framework: '프레임워크', tool: '툴' }

export default function SkillCard({ skill }: { skill: Skill }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(skill.name)
  const [level, setLevel] = useState(skill.level)
  const [category, setCategory] = useState(skill.category)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    try {
      await updateSkill(skill.id, { name, level, category })
      setEditing(false)
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  if (editing) {
    return (
      <div className="bg-white border border-indigo-200 rounded-xl p-4 flex flex-col gap-3">
        <input value={name} onChange={e => setName(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="스킬명" />
        <select value={category} onChange={e => setCategory(e.target.value as Skill['category'])} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
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
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5">취소</button>
          <button onClick={handleSave} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg">저장</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group hover:border-indigo-200 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-semibold text-sm text-gray-900">{skill.name}</span>
          <span className="ml-2 text-[10px] text-gray-400">{categoryLabels[skill.category]}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil size={13} /></button>
          <button onClick={() => { if (confirm('스킬을 삭제하시겠습니까?')) deleteSkill(skill.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${skill.level}%` }} />
      </div>
    </div>
  )
}

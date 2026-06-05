'use client'
import { useState } from 'react'
import type { User } from '@/lib/types'
import { updateProfile } from '@/app/(dashboard)/dashboard/about/actions'

export default function AboutForm({ profile }: { profile: User }) {
  const [name, setName] = useState(profile.name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [isOpenToWork, setIsOpenToWork] = useState(profile.is_open_to_work)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateProfile({ name, bio, location, is_open_to_work: isOpenToWork })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">이름</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="홍길동"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">한 줄 소개</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Full-Stack Developer · 사용자 경험을 중시하는 개발자입니다."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">위치</label>
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Seoul, Korea"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isOpenToWork}
          onChange={e => setIsOpenToWork(e.target.checked)}
          className="w-4 h-4 accent-indigo-600"
        />
        <span className="text-sm text-gray-700">구직 중 배지 표시</span>
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 self-start transition-colors"
      >
        {saved ? '✓ 저장됨' : saving ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}

'use client'
import { useState } from 'react'
import type { Project } from '@/lib/types'

type Props = {
  initial?: Partial<Project>
  onSubmit: (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'order'>) => Promise<void>
  onCancel: () => void
}

export default function ProjectForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [techInput, setTechInput] = useState(initial?.tech_stack?.join(', ') ?? '')
  const [githubUrl, setGithubUrl] = useState(initial?.github_url ?? '')
  const [demoUrl, setDemoUrl] = useState(initial?.demo_url ?? '')
  const [status, setStatus] = useState<Project['status']>(initial?.status ?? 'wip')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        title,
        description: description || null,
        tech_stack: techInput.split(',').map(t => t.trim()).filter(Boolean),
        github_url: githubUrl || null,
        demo_url: demoUrl || null,
        thumbnail: null,
        status,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        required value={title} onChange={e => setTitle(e.target.value)}
        placeholder="프로젝트 이름 *"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <textarea
        value={description} onChange={e => setDescription(e.target.value)}
        placeholder="설명"
        rows={3}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
      />
      <input
        value={techInput} onChange={e => setTechInput(e.target.value)}
        placeholder="기술스택 (쉼표로 구분: React, Node.js)"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <input
        value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
        placeholder="GitHub URL"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <input
        value={demoUrl} onChange={e => setDemoUrl(e.target.value)}
        placeholder="데모 URL"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <select
        value={status} onChange={e => setStatus(e.target.value as Project['status'])}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <option value="live">Live</option>
        <option value="wip">WIP</option>
        <option value="archived">Archived</option>
      </select>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">취소</button>
        <button
          type="submit" disabled={loading}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}

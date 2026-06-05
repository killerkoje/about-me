'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import ProjectForm from './ProjectForm'
import { createProject } from '@/app/(dashboard)/dashboard/projects/actions'

export default function AddProjectButton() {
  const [open, setOpen] = useState(false)

  if (open) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
          <h2 className="font-semibold text-gray-900 mb-4">프로젝트 추가</h2>
          <ProjectForm
            onSubmit={async data => { await createProject(data); setOpen(false) }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm"
    >
      <Plus size={15} /> 추가
    </button>
  )
}

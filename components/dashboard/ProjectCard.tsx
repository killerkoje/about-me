'use client'
import { useState } from 'react'
import { Pencil, Trash2, GripVertical, ExternalLink } from 'lucide-react'
import type { Project } from '@/lib/types'
import ProjectForm from './ProjectForm'
import { updateProject, deleteProject } from '@/app/(dashboard)/dashboard/projects/actions'

const statusLabels = { live: 'Live', wip: 'WIP', archived: 'Archived' }
const statusColors = {
  live: 'bg-emerald-50 text-emerald-600',
  wip: 'bg-amber-50 text-amber-600',
  archived: 'bg-gray-100 text-gray-500',
}

export default function ProjectCard({ project, dragHandle }: { project: Project; dragHandle?: React.ReactNode }) {
  const [editing, setEditing] = useState(false)

  async function handleUpdate(data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'order'>) {
    try {
      await updateProject(project.id, data)
      setEditing(false)
    } catch {
      // form's own error state will show the error
    }
  }

  if (editing) {
    return (
      <div className="bg-white border border-indigo-200 rounded-xl p-4">
        <ProjectForm initial={project} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-colors group">
      <div className="flex items-start gap-2">
        <div className="text-gray-300 cursor-grab mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {dragHandle ?? <GripVertical size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{project.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
              {statusLabels[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">{project.description}</p>
          )}
          {project.tech_stack.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {project.tech_stack.map(t => (
                <span key={t} className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-600">{t}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
                <ExternalLink size={10} /> GitHub
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
                <ExternalLink size={10} /> Demo
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <Pencil size={13} />
          </button>
          <button onClick={() => {
            if (confirm('프로젝트를 삭제하시겠습니까?')) deleteProject(project.id)
          }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

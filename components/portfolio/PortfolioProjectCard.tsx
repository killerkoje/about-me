import type { Project } from '@/lib/types'
import { ExternalLink, GitBranch } from 'lucide-react'

const statusColors = {
  live: 'bg-emerald-50 text-emerald-600',
  wip: 'bg-amber-50 text-amber-600',
  archived: 'bg-gray-100 text-gray-500',
}
const statusLabels = { live: 'Live', wip: 'WIP', archived: 'Archived' }

export default function PortfolioProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-indigo-200 hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{project.title}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>
      {project.description && <p className="text-sm text-gray-500 mb-3 leading-relaxed">{project.description}</p>}
      {(project.tech_stack ?? []).length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {(project.tech_stack ?? []).map((t, i) => (
            <span key={`${t}-${i}`} className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-600">{t}</span>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        {project.github_url && (
          <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-500 hover:underline">
            <GitBranch size={11} />GitHub
          </a>
        )}
        {project.demo_url && (
          <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-500 hover:underline">
            <ExternalLink size={11} />Demo
          </a>
        )}
      </div>
    </div>
  )
}

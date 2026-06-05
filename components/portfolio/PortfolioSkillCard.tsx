import type { Skill } from '@/lib/types'

const categoryLabels: Record<Skill['category'], string> = {
  language: '언어',
  framework: '프레임워크',
  tool: '툴',
}

export default function PortfolioSkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-gray-900">{skill.name}</span>
        <span className="text-[10px] text-gray-400">{categoryLabels[skill.category]}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          style={{ width: `${skill.level}%` }}
        />
      </div>
    </div>
  )
}

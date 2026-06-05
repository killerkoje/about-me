import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectCard from '@/components/dashboard/ProjectCard'
import AddProjectButton from '@/components/dashboard/AddProjectButton'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('order')

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">프로젝트</h1>
          <p className="text-gray-500 text-sm mt-0.5">{projects?.length ?? 0}개의 프로젝트</p>
        </div>
        <AddProjectButton />
      </div>
      <div className="flex flex-col gap-3">
        {projects?.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {(!projects || projects.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-12">아직 프로젝트가 없어요. 추가해보세요!</p>
        )}
      </div>
    </div>
  )
}

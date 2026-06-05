import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SkillCard from '@/components/dashboard/SkillCard'
import AddSkillButton from '@/components/dashboard/AddSkillButton'

export default async function SkillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: skills } = await supabase.from('skills').select('*').eq('user_id', user.id).order('order')

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">기술 스택</h1>
          <p className="text-gray-500 text-sm mt-0.5">{skills?.length ?? 0}개의 스킬</p>
        </div>
        <AddSkillButton />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {skills?.map(skill => <SkillCard key={skill.id} skill={skill} />)}
        {(!skills || skills.length === 0) && (
          <p className="col-span-2 text-gray-400 text-sm text-center py-12">스킬을 추가해보세요!</p>
        )}
      </div>
    </div>
  )
}

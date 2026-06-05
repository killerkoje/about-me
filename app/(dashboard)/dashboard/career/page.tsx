import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CareerCard from '@/components/dashboard/CareerCard'
import AddCareerButton from '@/components/dashboard/AddCareerButton'

export default async function CareerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: careers } = await supabase.from('careers').select('*').eq('user_id', user.id).order('order')

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">경력</h1>
          <p className="text-gray-500 text-sm mt-0.5">{careers?.length ?? 0}개의 경력</p>
        </div>
        <AddCareerButton />
      </div>
      <div className="flex flex-col gap-3">
        {careers?.map(career => <CareerCard key={career.id} career={career} />)}
        {(!careers || careers.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-12">경력을 추가해보세요!</p>
        )}
      </div>
    </div>
  )
}

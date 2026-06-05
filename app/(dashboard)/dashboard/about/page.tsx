import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AboutForm from '@/components/dashboard/AboutForm'

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', user.id).single()

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">소개</h1>
      {profileError && <p className="text-sm text-red-500">프로필을 불러오지 못했습니다.</p>}
      {profile && <AboutForm profile={profile} />}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AboutForm from '@/components/dashboard/AboutForm'

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">소개</h1>
      {profile && <AboutForm profile={profile} />}
    </div>
  )
}

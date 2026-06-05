import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApiKeyForm from '@/components/dashboard/ApiKeyForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('anthropic_api_key')
    .eq('id', user.id)
    .single()

  const hasKey = !!profile?.anthropic_api_key

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">설정</h1>
      <p className="text-gray-500 text-sm mb-8">계정 및 연동 설정</p>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">AI 분석 연동</h2>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <ApiKeyForm hasKey={hasKey} />
        </div>
      </section>
    </div>
  )
}

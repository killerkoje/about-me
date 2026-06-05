import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GithubImporter from '@/components/dashboard/GithubImporter'

export default async function GithubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('anthropic_api_key')
    .eq('id', user.id)
    .single()

  const hasApiKey = !!profile?.anthropic_api_key

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">GitHub 분석</h1>
      <p className="text-gray-500 text-sm mb-6">
        레포의 커밋 내역을 AI가 분석해서 포트폴리오를 자동으로 작성합니다.
      </p>
      <GithubImporter hasApiKey={hasApiKey} />
    </div>
  )
}

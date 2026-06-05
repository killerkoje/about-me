import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RepoAnalyzer from '@/components/dashboard/RepoAnalyzer'

export default async function GithubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">GitHub 분석</h1>
      <p className="text-gray-500 text-sm mb-6">
        레포를 선택해 커밋 내역, README, 사용 언어를 확인하고 AI로 포트폴리오를 작성하세요.
      </p>
      <RepoAnalyzer />
    </div>
  )
}

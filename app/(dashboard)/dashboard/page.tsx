import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FolderOpen, Zap, Briefcase, User } from 'lucide-react'
import CopyLinkButton from '@/components/dashboard/CopyLinkButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: projectCount }, { count: skillCount }, { count: careerCount }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('skills').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('careers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const portfolioUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${profile?.username}`

  const sections = [
    { label: '프로젝트', count: projectCount ?? 0, href: '/dashboard/projects', icon: FolderOpen, color: 'text-indigo-500 bg-indigo-50' },
    { label: '스킬', count: skillCount ?? 0, href: '/dashboard/skills', icon: Zap, color: 'text-violet-500 bg-violet-50' },
    { label: '경력', count: careerCount ?? 0, href: '/dashboard/career', icon: Briefcase, color: 'text-blue-500 bg-blue-50' },
    { label: '소개', count: null, href: '/dashboard/about', icon: User, color: 'text-pink-500 bg-pink-50' },
  ]

  return (
    <div className="p-6 max-w-3xl">
      {profile && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center gap-4 text-white mb-6 shadow-lg">
          {profile.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={profile.name ?? profile.username}
              width={56}
              height={56}
              className="rounded-full border-2 border-white/30"
            />
          )}
          <div>
            <h1 className="text-lg font-bold">{profile.name ?? profile.username}</h1>
            {profile.bio && <p className="text-white/75 text-sm mt-0.5">{profile.bio}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {sections.map(({ label, count, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:-translate-y-0.5 transition-all shadow-sm"
          >
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
              <Icon size={16} />
            </div>
            {count !== null && <div className="text-xl font-bold text-gray-900">{count}</div>}
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">내 포트폴리오 링크</p>
          <p className="text-sm font-mono text-indigo-600 font-medium truncate">{portfolioUrl}</p>
        </div>
        <CopyLinkButton url={portfolioUrl} />
        <Link
          href={`/${profile?.username}`}
          target="_blank"
          className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
        >
          미리보기 →
        </Link>
      </div>
    </div>
  )
}

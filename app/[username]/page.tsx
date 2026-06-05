import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import PortfolioProfileHero from '@/components/portfolio/PortfolioProfileHero'
import PortfolioProjectCard from '@/components/portfolio/PortfolioProjectCard'
import PortfolioSkillCard from '@/components/portfolio/PortfolioSkillCard'
import PortfolioCareerCard from '@/components/portfolio/PortfolioCareerCard'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('name, bio, avatar_url')
    .eq('username', username)
    .single()
  if (!user) return { title: '404' }
  return {
    title: `${user.name ?? username} | devfolio`,
    description: user.bio ?? `${user.name ?? username}의 개발자 포트폴리오`,
    openGraph: {
      title: `${user.name ?? username} | devfolio`,
      description: user.bio ?? '',
      images: user.avatar_url ? [user.avatar_url] : [],
    },
  }
}

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()
  if (!user) notFound()

  const [{ data: projects }, { data: skills }, { data: careers }] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', user.id).neq('status', 'archived').order('order'),
    supabase.from('skills').select('*').eq('user_id', user.id).order('order'),
    supabase.from('careers').select('*').eq('user_id', user.id).order('order'),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 h-12 flex items-center">
        <span className="font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">devfolio</span>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        <PortfolioProfileHero user={user} />
        {projects && projects.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">🚀 프로젝트</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map(p => <PortfolioProjectCard key={p.id} project={p} />)}
            </div>
          </section>
        )}
        {skills && skills.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">⚡ 기술 스택</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {skills.map(s => <PortfolioSkillCard key={s.id} skill={s} />)}
            </div>
          </section>
        )}
        {careers && careers.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">💼 경력</h2>
            <div className="flex flex-col gap-3">
              {careers.map(c => <PortfolioCareerCard key={c.id} career={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

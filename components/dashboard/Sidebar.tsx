'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Zap, Briefcase, User, Link2, Eye, Settings, LogOut, GitBranch } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드', exact: true },
  { href: '/dashboard/projects', icon: FolderOpen, label: '프로젝트' },
  { href: '/dashboard/skills', icon: Zap, label: '스킬' },
  { href: '/dashboard/career', icon: Briefcase, label: '경력' },
  { href: '/dashboard/about', icon: User, label: '소개' },
  { href: '/dashboard/github', icon: GitBranch, label: 'GitHub 분석' },
]

const publicItems = [
  { href: '/dashboard/share', icon: Link2, label: '링크 공유' },
]

export default function Sidebar({ username }: { username: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col py-5 px-3">
      <div className="px-3 mb-6">
        <span className="text-base font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          devfolio
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pb-1.5 pt-2">관리</p>
        {navItems.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(href, exact)
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pb-1.5 pt-4">공개 페이지</p>
        {publicItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(href)
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
        <Link
          href={`/${username}`}
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Eye size={15} />
          미리보기
        </Link>
      </nav>

      <div className="border-t border-gray-100 pt-3 mt-3 flex flex-col gap-0.5">
        <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <Settings size={15} />설정
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 w-full text-left"
        >
          <LogOut size={15} />로그아웃
        </button>
      </div>
    </aside>
  )
}

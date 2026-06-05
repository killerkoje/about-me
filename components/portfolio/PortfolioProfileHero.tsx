import type { User } from '@/lib/types'
import { MapPin, GitBranch } from 'lucide-react'
import Image from 'next/image'

export default function PortfolioProfileHero({ user }: { user: User }) {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center gap-5 text-white shadow-lg">
      {user.avatar_url && (
        <Image
          src={user.avatar_url}
          alt={user.name ?? user.username}
          width={64}
          height={64}
          className="rounded-full border-2 border-white/40 flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold mb-1">{user.name ?? user.username}</h1>
        {user.bio && <p className="text-white/80 text-sm mb-2">{user.bio}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          {user.location && <span className="flex items-center gap-1 text-xs text-white/70"><MapPin size={11} />{user.location}</span>}
          {user.github_url && <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-white/70 hover:text-white"><GitBranch size={11} />GitHub</a>}
          {user.is_open_to_work && <span className="text-[10px] bg-emerald-400/20 border border-emerald-400/40 px-2 py-0.5 rounded-full">✓ 구직중</span>}
        </div>
      </div>
    </div>
  )
}

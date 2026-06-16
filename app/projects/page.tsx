import { fetchUserRepos } from '@/lib/github/api'
import { PROJECT_META } from '@/lib/projects-meta'
import Link from 'next/link'

const EXCLUDED_REPOS = [
  'content-hub-front',
  'dubright_backend',
  'video-encoder',
  'vogopang-library-back-office',
  'vogopang-partner-back-office',
  'pudding_front_admin',
  'pudding-back',
  'pickme_back',
  'content-hub',
  'pickme_front_admin',
  'dobedopop_front',
  'aws-security',
  'audiobook_app',
  'audiobook_front',
  'audiobook_back',
  'audiobook_admin_front',
  'CS_admin',
  'audiobook_adminback',
  'pickme_dubright_front',
  'pickme_dubright_back',
  'kids_teaser',
  's3uploader',
  'kids_app',
  'dubright_dashboard',
  'quasar_base',
  'kids_admin',
  'dubright_app',
  'dubright-app-back',
  'vogopang_voiceville_admin',
  'vogopang_B2C_APP_TEST',
  'labeling_back',
  'infrastructure',
  'pudding_flutter',
  'dubright_pickme_migration_script',
  'dobedub_processing',
  'pickeme-teaser-back',
  'dobedub_library_backend',
  'dubright_flutter',
  'puddingtoon-next',
  'kids_back',
  'dobedub_library_front',
  'dubright_artist_front',
  'player2',
  'dubright_back',
  'dubright_record',
  'vogopang-b2c-app',
]

export default async function ProjectsPage() {
  const token = process.env.GITHUB_TOKEN
  const username = 'LEEHEEWON123'

  let repos: any[] = []
  let error = false

  if (token) {
    try {
      const all = await fetchUserRepos(token)
      repos = all.filter(r => !EXCLUDED_REPOS.includes(r.name))
    } catch {
      error = true
    }
  }

  return (
    <div className="flex h-screen font-sans">
      {/* 왼쪽 패널 */}
      <aside className="w-44 flex flex-col gap-8 py-10 px-8 bg-white border-r border-gray-100 shrink-0">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Portfolio</span>
        <nav className="flex flex-col gap-4">
          <a
            href="https://github.com/LEEHEEWON123"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200"
          >
            Github.
          </a>
          <a
            href="https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200"
          >
            LinkedIn.
          </a>
          <a
            href="/projects"
            className="text-sm text-black font-semibold transition-colors duration-200"
          >
            Projects.
          </a>
        </nav>
        <span className="text-[11px] text-gray-500">leeheewon © 2026</span>
      </aside>

      {/* 오른쪽 - 프로젝트 목록 */}
      <main className="flex-1 bg-gray-100 overflow-y-auto px-10 py-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">← back</Link>
            <h1 className="text-lg font-bold text-gray-900">Projects.</h1>
            {repos.length > 0 && (
              <span className="text-xs text-gray-400">{repos.length}개</span>
            )}
          </div>

          {!token && (
            <p className="text-sm text-gray-400">GITHUB_TOKEN 환경변수를 설정해주세요.</p>
          )}

          {error && (
            <p className="text-sm text-red-400">GitHub API 오류가 발생했습니다.</p>
          )}

          {repos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {repos.map((repo) => {
                const meta = PROJECT_META[repo.name]
                return (
                  <div
                    key={repo.id}
                    className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-300 transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {repo.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {repo.private && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            private
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-5 mb-3 line-clamp-2">
                      {meta?.description ?? repo.description ?? ''}
                    </p>

                    {meta?.highlights && (
                      <ul className="flex flex-col gap-1 mb-4">
                        {meta.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-500">
                            <span className="mt-0.5 shrink-0 text-gray-300">●</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        {repo.language && (
                          <span className="text-[11px] text-gray-400">{repo.language}</span>
                        )}
                        {repo.stargazers_count > 0 && (
                          <span className="text-[11px] text-gray-400">★ {repo.stargazers_count}</span>
                        )}
                      </div>
                      {meta && (
                        <Link
                          href={`/projects/${repo.name}`}
                          className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          자세히 보기 →
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

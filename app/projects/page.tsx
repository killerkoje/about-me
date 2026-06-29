import { fetchUserRepos, fetchRepoLanguages, type GithubLanguages } from '@/lib/github/api'
import ProjectsTabs from '@/components/portfolio/ProjectsTabs'
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
  'vogopang_back',
  'new-dubright',
  'pickmetoon_teaser',
  'edu_dobedub',
  'senior_dobedub',
  'kid_dobedub',
  'kids_front',
  'pickme_teaser_front',
]

const SIDE_PROJECTS = [
  'about-me',
  'Cultural-Heritage-Outing',
  'village-run',
  'lucky-defense',
  'harness_build',
  'nugu-seyo',
  'face-fortune',
  'call-distance-tracker',
  'legal-recorder-hybrid',
  'gomoku_algorithm_test',
  'llm_test',
  'AX_TEST',
  'panorama_app',
  'horror_game',
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

  const sideRepos = repos.filter(r => SIDE_PROJECTS.includes(r.name))
  const companyRepos = repos.filter(r => !SIDE_PROJECTS.includes(r.name))

  // 언어 통계 병렬 fetch (실패한 레포는 무시)
  async function aggregateLanguages(repoList: typeof repos): Promise<GithubLanguages> {
    if (!token) return {}
    const results = await Promise.allSettled(
      repoList.map(r => fetchRepoLanguages(token, r.full_name))
    )
    const totals: GithubLanguages = {}
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const [lang, bytes] of Object.entries(r.value)) {
          totals[lang] = (totals[lang] ?? 0) + bytes
        }
      }
    }
    return totals
  }

  const [companyLanguages, sideLanguages] = await Promise.all([
    aggregateLanguages(companyRepos),
    aggregateLanguages(sideRepos),
  ])

  // 봇파더 기반 자동화 코드라 실제 작성 스택 아님
  delete companyLanguages['Python']

  return (
    <div className="flex flex-col sm:flex-row min-h-screen font-sans">
      {/* 모바일 상단 헤더 */}
      <header className="flex sm:hidden items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Portfolio</span>
        <nav className="flex items-center gap-4">
          <a href="https://github.com/LEEHEEWON123" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900">Github.</a>
          <a href="https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-900">LinkedIn.</a>
          <a href="/projects" className="text-xs text-black font-semibold">Projects.</a>
        </nav>
      </header>

      {/* 왼쪽 패널 (데스크톱) */}
      <aside className="hidden sm:flex w-44 flex-col gap-8 py-10 px-8 bg-white border-r border-gray-100 shrink-0">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Portfolio</span>
        <nav className="flex flex-col gap-4">
          <a href="https://github.com/LEEHEEWON123" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200">Github.</a>
          <a href="https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200">LinkedIn.</a>
          <a href="/projects" className="text-sm text-black font-semibold transition-colors duration-200">Projects.</a>
        </nav>
        <span className="text-[11px] text-gray-500">leeheewon © 2026</span>
      </aside>

      {/* 오른쪽 - 프로젝트 목록 */}
      <main className="flex-1 bg-gray-100 overflow-y-auto px-6 sm:px-10 py-8 sm:py-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">← back</Link>
            <h1 className="text-lg font-bold text-gray-900">Projects.</h1>
          </div>

          {!token && <p className="text-sm text-gray-400">GITHUB_TOKEN 환경변수를 설정해주세요.</p>}
          {error && <p className="text-sm text-red-400">GitHub API 오류가 발생했습니다.</p>}

          {repos.length > 0 && (
            <ProjectsTabs
              companyRepos={companyRepos}
              sideRepos={sideRepos}
              companyLanguages={companyLanguages}
              sideLanguages={sideLanguages}
            />
          )}
        </div>
      </main>
    </div>
  )
}

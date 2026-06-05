# GitHub 분석 파이프라인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub 레포 선택 → 커밋/언어/README 분석 → 프로젝트·스킬 자동 생성 파이프라인을 대시보드에 구축한다.

**Architecture:** Supabase GitHub OAuth의 `provider_token`을 서버 액션에서 꺼내 GitHub REST API를 직접 호출한다. 별도 Edge Function 없이 Next.js Server Actions로 처리하며, 레포 목록 조회와 임포트를 두 단계로 분리해 사용자가 레포를 선택할 수 있게 한다.

**Tech Stack:** Next.js 16 Server Actions, GitHub REST API (fetch), Supabase SSR, Tailwind CSS, lucide-react

---

## 파일 구조

```
lib/
  github/
    api.ts                      # GitHub REST API 호출 헬퍼 (순수 함수들)

app/(dashboard)/dashboard/
  github/
    page.tsx                    # GitHub 분석 페이지 (서버 컴포넌트, 간단한 shell)
    actions.ts                  # getMyRepos / importSelectedRepos 서버 액션

components/dashboard/
  GithubImporter.tsx            # 레포 선택 + 임포트 전체 플로우 클라이언트 컴포넌트
  Sidebar.tsx                   # GitHub 분석 메뉴 추가 (수정)

lib/
  types.ts                      # User에 github_stats 필드 추가 (수정)
```

---

## Task 1: DB 마이그레이션 + 타입 업데이트

**Files:**
- Modify: `lib/types.ts`
- SQL 실행: Supabase SQL Editor

- [ ] **Step 1: Supabase SQL Editor에서 마이그레이션 실행**

Supabase 대시보드 → SQL Editor에서 아래 SQL 실행:

```sql
-- github_stats 컬럼 추가 (이미 있으면 무시)
alter table public.users
  add column if not exists github_stats jsonb;
```

Expected: 에러 없이 완료.

- [ ] **Step 2: lib/types.ts 업데이트**

`lib/types.ts`의 `User` 타입에 `github_stats` 필드를 추가한다:

```ts
export type GithubStats = {
  total_commits: number
  stars: number
  followers: number
  top_languages: string[]
}

export type User = {
  id: string
  username: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  github_url: string | null
  email: string | null
  is_open_to_work: boolean
  github_stats: GithubStats | null
  created_at: string
}

export type Project = {
  id: string
  user_id: string
  title: string
  description: string | null
  tech_stack: string[]
  github_url: string | null
  demo_url: string | null
  thumbnail: string | null
  status: 'live' | 'wip' | 'archived'
  order: number
  created_at: string
}

export type Skill = {
  id: string
  user_id: string
  name: string
  category: 'language' | 'framework' | 'tool'
  level: number
  order: number
}

export type Career = {
  id: string
  user_id: string
  company: string
  role: string
  start_date: string | null
  end_date: string | null
  description: string | null
  order: number
}

export type PortfolioData = {
  user: User
  projects: Project[]
  skills: Skill[]
  careers: Career[]
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: TypeScript 오류 없음. (github_stats가 기존 코드에서 참조되지 않으므로 breaking change 없음)

- [ ] **Step 4: 커밋**

```bash
git add lib/types.ts
git commit -m "feat: add github_stats field to User type and DB migration"
```

---

## Task 2: GitHub API 헬퍼 라이브러리

**Files:**
- Create: `lib/github/api.ts`

- [ ] **Step 1: lib/github/ 디렉토리에 api.ts 생성**

`lib/github/api.ts`:

```ts
const BASE_URL = 'https://api.github.com'

// ─── 타입 정의 ───────────────────────────────────────────────

export type GithubRepo = {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  fork: boolean
  private: boolean
  default_branch: string
  updated_at: string
}

export type GithubLanguages = Record<string, number>

// ─── 기본 fetch 헬퍼 ─────────────────────────────────────────

async function ghFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

// ─── 공개 API 함수들 ──────────────────────────────────────────

/**
 * 인증된 유저의 레포 전체 목록 (fork 제외).
 * per_page=100으로 페이지네이션하여 모두 수집.
 */
export async function fetchUserRepos(token: string): Promise<GithubRepo[]> {
  const all: GithubRepo[] = []
  let page = 1
  while (true) {
    const batch = await ghFetch<GithubRepo[]>(
      token,
      `/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`
    )
    all.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return all.filter(r => !r.fork)
}

/**
 * 특정 레포의 언어별 바이트 수.
 * 예: { "TypeScript": 12345, "CSS": 678 }
 */
export async function fetchRepoLanguages(
  token: string,
  fullName: string
): Promise<GithubLanguages> {
  return ghFetch<GithubLanguages>(token, `/repos/${fullName}/languages`)
}

/**
 * README 본문 텍스트 (base64 디코딩). 없으면 null.
 */
export async function fetchRepoReadme(
  token: string,
  fullName: string
): Promise<string | null> {
  try {
    const data = await ghFetch<{ content: string }>(token, `/repos/${fullName}/readme`)
    return Buffer.from(data.content, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

/**
 * 유저의 전체 통계: 팔로워, 전체 스타(소유 레포 합산), 공개 레포 수.
 * 주의: fetchUserRepos를 내부에서 호출하므로 allRepos를 외부에서 넘겨도 됨.
 */
export async function fetchUserStats(
  token: string,
  allRepos: GithubRepo[]
): Promise<{ followers: number; total_stars: number; public_repos: number }> {
  const me = await ghFetch<{ followers: number; public_repos: number }>(token, '/user')
  const total_stars = allRepos.reduce((s, r) => s + r.stargazers_count, 0)
  return {
    followers: me.followers,
    total_stars,
    public_repos: me.public_repos,
  }
}

/**
 * 특정 레포에서 author가 만든 커밋 수.
 * Link 헤더의 last 페이지 번호로 계산.
 */
export async function fetchRepoCommitCount(
  token: string,
  fullName: string,
  author: string
): Promise<number> {
  try {
    const res = await fetch(
      `${BASE_URL}/repos/${fullName}/commits?author=${author}&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      }
    )
    if (!res.ok) return 0
    const link = res.headers.get('link') ?? ''
    const match = link.match(/[?&]page=(\d+)>; rel="last"/)
    if (match) return parseInt(match[1])
    // Link 헤더 없음 = 1페이지 이하 = 최대 1개
    const data = await res.json() as unknown[]
    return data.length
  } catch {
    return 0
  }
}

/**
 * README에서 첫 번째 의미 있는 문단 추출 (마크다운 제목/배지 제거).
 * 최대 200자.
 */
export function extractReadmeSummary(readme: string | null): string | null {
  if (!readme) return null
  const lines = readme
    .split('\n')
    .map(l => l.trim())
    .filter(l =>
      l.length > 10 &&
      !l.startsWith('#') &&
      !l.startsWith('!') &&    // 이미지/배지
      !l.startsWith('<') &&    // HTML 태그
      !l.startsWith('[') &&    // 링크 전용 라인
      !l.startsWith('|')       // 테이블
    )
  const summary = lines.slice(0, 2).join(' ')
  return summary.slice(0, 200) || null
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add lib/github/api.ts
git commit -m "feat: add GitHub API helper lib"
```

---

## Task 3: GitHub 분석 서버 액션

**Files:**
- Create: `app/(dashboard)/dashboard/github/actions.ts`

- [ ] **Step 1: actions.ts 작성**

`app/(dashboard)/dashboard/github/actions.ts`:

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  fetchUserRepos,
  fetchRepoLanguages,
  fetchRepoReadme,
  fetchUserStats,
  fetchRepoCommitCount,
  extractReadmeSummary,
  type GithubRepo,
} from '@/lib/github/api'

/**
 * 현재 로그인한 유저의 GitHub 레포 목록 반환.
 * provider_token이 없으면 throw → 클라이언트에서 에러 처리.
 */
export async function getMyRepos(): Promise<GithubRepo[]> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.provider_token) {
    throw new Error('GitHub 토큰을 찾을 수 없습니다. 로그아웃 후 다시 로그인해주세요.')
  }
  return fetchUserRepos(session.provider_token)
}

/**
 * 선택한 레포들을 분석해서:
 * 1. 프로젝트 카드 생성 (이미 있는 github_url이면 skip)
 * 2. 언어별 스킬 생성 (이미 있는 name이면 skip)
 * 3. github_stats 업데이트 (total_commits, stars, followers, top_languages)
 */
export async function importSelectedRepos(repoFullNames: string[]): Promise<void> {
  if (repoFullNames.length === 0) return

  const supabase = await createClient()
  const [{ data: { session } }, { data: { user } }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ])
  if (!user || !session?.provider_token) throw new Error('Unauthorized')

  const token = session.provider_token
  const githubUsername = (user.user_metadata?.user_name ?? user.email ?? '') as string

  // ── 1. 전체 레포 목록에서 선택된 것만 필터 ──────────────────────
  const allRepos = await fetchUserRepos(token)
  const selected = allRepos.filter(r => repoFullNames.includes(r.full_name))

  // ── 2. 선택 레포 상세 정보 병렬 수집 ────────────────────────────
  const languageTotals: Record<string, number> = {}

  const repoDetails = await Promise.all(
    selected.map(async repo => {
      const [languages, readme] = await Promise.all([
        fetchRepoLanguages(token, repo.full_name),
        fetchRepoReadme(token, repo.full_name),
      ])
      // 언어 바이트 합산
      Object.entries(languages).forEach(([lang, bytes]) => {
        languageTotals[lang] = (languageTotals[lang] ?? 0) + bytes
      })
      return { repo, languages, readme }
    })
  )

  // ── 3. 프로젝트 카드 생성 (중복 skip) ───────────────────────────
  for (const { repo, languages, readme } of repoDetails) {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_url', repo.html_url)
      .maybeSingle()

    if (existing) continue // 이미 있으면 skip

    const tech_stack = Object.keys(languages).slice(0, 6)
    const description = extractReadmeSummary(readme) ?? repo.description

    await supabase.from('projects').insert({
      user_id: user.id,
      title: repo.name,
      description: description || null,
      tech_stack,
      github_url: repo.html_url,
      demo_url: repo.homepage || null,
      status: 'live' as const,
      order: 0,
    })
  }

  // ── 4. 스킬 생성 (언어 집계 상위 15개, 중복 skip) ───────────────
  const sortedLangs = Object.entries(languageTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
  const totalBytes = sortedLangs.reduce((s, [, b]) => s + b, 0)

  for (const [lang, bytes] of sortedLangs) {
    const { data: existing } = await supabase
      .from('skills')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', lang)
      .maybeSingle()

    if (existing) continue // 이미 있으면 skip

    // 사용 비율 기반 숙련도 (20~95 범위로 압축)
    const ratio = totalBytes > 0 ? bytes / totalBytes : 0
    const level = Math.max(20, Math.min(95, Math.round(ratio * 300)))

    await supabase.from('skills').insert({
      user_id: user.id,
      name: lang,
      category: 'language' as const,
      level,
      order: 0,
    })
  }

  // ── 5. GitHub 통계 수집 & 저장 ──────────────────────────────────
  const [userStats, commitCounts] = await Promise.all([
    fetchUserStats(token, allRepos),
    Promise.all(
      selected.map(r => fetchRepoCommitCount(token, r.full_name, githubUsername))
    ),
  ])

  const total_commits = commitCounts.reduce((s, c) => s + c, 0)
  const top_languages = Object.entries(languageTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name)

  await supabase.from('users').update({
    github_stats: {
      total_commits,
      stars: userStats.total_stars,
      followers: userStats.followers,
      top_languages,
    },
  }).eq('id', user.id)

  // ── 6. 캐시 무효화 ──────────────────────────────────────────────
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/skills')
  revalidatePath('/dashboard/github')
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: 에러 없음. `/dashboard/github` 라우트가 등록되지 않았다는 경고가 나올 수 있지만 빌드는 통과.

- [ ] **Step 3: 커밋**

```bash
git add app/\(dashboard\)/dashboard/github/actions.ts
git commit -m "feat: add GitHub analysis server actions"
```

---

## Task 4: GithubImporter UI + GitHub 페이지

**Files:**
- Create: `components/dashboard/GithubImporter.tsx`
- Create: `app/(dashboard)/dashboard/github/page.tsx`

- [ ] **Step 1: GithubImporter 클라이언트 컴포넌트 작성**

`components/dashboard/GithubImporter.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { GitBranch, Loader2, Check, ChevronRight, RefreshCw } from 'lucide-react'
import { getMyRepos, importSelectedRepos } from '@/app/(dashboard)/dashboard/github/actions'
import type { GithubRepo } from '@/lib/github/api'

type Step = 'idle' | 'loading' | 'selecting' | 'importing' | 'done' | 'error'

export default function GithubImporter() {
  const [step, setStep] = useState<Step>('idle')
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)

  async function handleFetchRepos() {
    setStep('loading')
    setErrorMsg(null)
    try {
      const data = await getMyRepos()
      setRepos(data)
      setStep('selecting')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '레포 목록을 불러오지 못했습니다.')
      setStep('error')
    }
  }

  async function handleImport() {
    if (selected.size === 0) return
    setStep('importing')
    setErrorMsg(null)
    try {
      await importSelectedRepos([...selected])
      setImportedCount(selected.size)
      setStep('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '가져오기에 실패했습니다.')
      setStep('error')
    }
  }

  function toggleRepo(fullName: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(fullName)) next.delete(fullName)
      else next.add(fullName)
      return next
    })
  }

  function reset() {
    setStep('idle')
    setRepos([])
    setSelected(new Set())
    setErrorMsg(null)
  }

  // ── idle / error ──────────────────────────────────────────────
  if (step === 'idle' || step === 'error') {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center">
          <GitBranch size={26} className="text-white" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-gray-900 mb-1">GitHub 레포 분석</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            내 레포를 선택하면 README, 언어, 커밋 수를 분석해서<br />
            프로젝트 카드와 스킬을 자동으로 만들어줍니다.
          </p>
        </div>
        {errorMsg && (
          <p className="text-sm text-red-500 text-center max-w-sm">{errorMsg}</p>
        )}
        <button
          onClick={handleFetchRepos}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <GitBranch size={15} />
          레포 목록 불러오기
        </button>
      </div>
    )
  }

  // ── loading ────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-gray-500">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">GitHub 레포 목록 불러오는 중...</p>
      </div>
    )
  }

  // ── importing ──────────────────────────────────────────────────
  if (step === 'importing') {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
        <p className="text-sm text-gray-700 font-medium">분석 중입니다...</p>
        <p className="text-xs text-gray-400">
          {selected.size}개 레포의 README, 언어, 커밋을 읽고 있습니다
        </p>
      </div>
    )
  }

  // ── done ───────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <Check size={28} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-gray-900 mb-1">분석 완료!</h2>
          <p className="text-sm text-gray-500">
            {importedCount}개 레포에서 프로젝트와 스킬이 추가되었습니다.
          </p>
        </div>
        <div className="flex gap-4">
          <a
            href="/dashboard/projects"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            프로젝트 확인 <ChevronRight size={14} />
          </a>
          <a
            href="/dashboard/skills"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            스킬 확인 <ChevronRight size={14} />
          </a>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-2"
        >
          <RefreshCw size={12} /> 다시 분석하기
        </button>
      </div>
    )
  }

  // ── selecting ──────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">레포 선택</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {repos.length}개 레포 · {selected.size}개 선택됨
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2"
          >
            취소
          </button>
          <button
            onClick={handleImport}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <Check size={14} />
            가져오기 ({selected.size})
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {repos.map(repo => (
          <label
            key={repo.id}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              selected.has(repo.full_name)
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-gray-100 bg-white hover:border-indigo-200'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(repo.full_name)}
              onChange={() => toggleRepo(repo.full_name)}
              className="accent-indigo-600 w-4 h-4 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{repo.name}</div>
              {repo.description && (
                <p className="text-xs text-gray-500 truncate">{repo.description}</p>
              )}
            </div>
            {repo.language && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0">
                {repo.language}
              </span>
            )}
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              ★ {repo.stargazers_count}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: GitHub 분석 페이지 작성**

`app/(dashboard)/dashboard/github/page.tsx`:

```tsx
import GithubImporter from '@/components/dashboard/GithubImporter'

export default function GithubPage() {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">GitHub 분석</h1>
      <p className="text-gray-500 text-sm mb-6">
        레포를 선택하면 README, 사용 언어, 커밋 수를 분석해 포트폴리오를 자동으로 채웁니다.
      </p>
      <GithubImporter />
    </div>
  )
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: `/dashboard/github` 라우트 등록 확인. 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add components/dashboard/GithubImporter.tsx app/\(dashboard\)/dashboard/github/page.tsx
git commit -m "feat: add GitHub importer UI and analysis page"
```

---

## Task 5: 사이드바 업데이트

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Sidebar.tsx 수정 — GitHub 분석 메뉴 추가**

`components/dashboard/Sidebar.tsx`에서 `navItems` 배열에 GitHub 항목을 추가한다.

현재 import 라인:
```tsx
import { LayoutDashboard, FolderOpen, Zap, Briefcase, User, Link2, Eye, Settings, LogOut } from 'lucide-react'
```

변경 후:
```tsx
import { LayoutDashboard, FolderOpen, Zap, Briefcase, User, Link2, Eye, Settings, LogOut, GitBranch } from 'lucide-react'
```

현재 `navItems`:
```tsx
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드', exact: true },
  { href: '/dashboard/projects', icon: FolderOpen, label: '프로젝트' },
  { href: '/dashboard/skills', icon: Zap, label: '스킬' },
  { href: '/dashboard/career', icon: Briefcase, label: '경력' },
  { href: '/dashboard/about', icon: User, label: '소개' },
]
```

변경 후:
```tsx
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드', exact: true },
  { href: '/dashboard/projects', icon: FolderOpen, label: '프로젝트' },
  { href: '/dashboard/skills', icon: Zap, label: '스킬' },
  { href: '/dashboard/career', icon: Briefcase, label: '경력' },
  { href: '/dashboard/about', icon: User, label: '소개' },
  { href: '/dashboard/github', icon: GitBranch, label: 'GitHub 분석' },
]
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add GitHub analysis link to dashboard sidebar"
```

---

## 셀프 리뷰 체크리스트

스펙 기준 커버리지:
- [x] 레포 목록 조회 (fetchUserRepos — fork 제외)
- [x] 사용자가 레포 선택 (GithubImporter 체크박스 UI)
- [x] 프로젝트 카드 자동 생성 (importSelectedRepos → projects.insert)
- [x] 언어 사용량 집계 → 스킬 자동 채움 (언어별 바이트 기반 level 계산)
- [x] GitHub 스탯 저장 (total_commits, stars, followers, top_languages)
- [x] README 파싱 → 프로젝트 설명 (extractReadmeSummary)
- [x] 커밋 히스토리 분석 결과만 저장 (Link 헤더 기반 count)
- [x] 중복 import skip (github_url / skill name 기준)
- [x] 사이드바 메뉴 연결

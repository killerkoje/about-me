# GitHub 분석 파이프라인 구현 계획 (Claude AI 요약 포함)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 유저가 GitHub 레포를 선택하면 커밋 내역 전체를 수집하고, 유저 본인의 Anthropic API 키로 Claude가 포트폴리오 설명을 자동 작성한다. API 키는 AES-256-GCM으로 암호화해서 DB에 저장한다.

**Architecture:** Next.js Server Actions에서 GitHub REST API로 커밋/언어 데이터를 수집하고, 유저의 암호화된 Anthropic API 키를 복호화해 `@anthropic-ai/sdk`로 Claude에게 요약을 요청한다. 키 암호화는 Node.js 내장 `crypto` 모듈(AES-256-GCM)을 사용하며, 서버 사이드 환경변수 `ENCRYPTION_KEY`로 보호한다.

**Tech Stack:** Next.js 16 Server Actions, GitHub REST API, @anthropic-ai/sdk, Node.js crypto (AES-256-GCM), Supabase SSR, Tailwind CSS

---

## 파일 구조

```
lib/
  crypto.ts                           # AES-256-GCM 암호화/복호화 헬퍼
  github/
    api.ts                            # GitHub API 헬퍼 (fetchRepoCommits 추가)
  anthropic/
    summarize.ts                      # Claude API 호출 — 커밋 → 포트폴리오 설명

app/(dashboard)/dashboard/
  settings/
    page.tsx                          # Settings 페이지 (API 키 입력 UI)
    actions.ts                        # saveApiKey / deleteApiKey 서버 액션
  github/
    page.tsx                          # GitHub 분석 페이지
    actions.ts                        # getMyRepos / importSelectedRepos 서버 액션

components/dashboard/
  ApiKeyForm.tsx                      # API 키 입력 폼 (클라이언트)
  GithubImporter.tsx                  # 레포 선택 + 임포트 플로우 (클라이언트)
  Sidebar.tsx                         # GitHub 분석 + Settings 메뉴 추가 (수정)

lib/
  types.ts                            # User에 anthropic_api_key, github_stats 추가 (수정)
```

---

## Task 1: DB 마이그레이션 + 타입 업데이트

**Files:**
- Modify: `lib/types.ts`
- SQL 실행: Supabase SQL Editor

- [ ] **Step 1: Supabase SQL Editor에서 마이그레이션 실행**

Supabase 대시보드 → SQL Editor에서 아래 SQL 실행:

```sql
-- anthropic_api_key, github_stats 컬럼 추가
alter table public.users
  add column if not exists anthropic_api_key text,
  add column if not exists github_stats jsonb;
```

Expected: 에러 없이 완료.

- [ ] **Step 2: lib/types.ts 전체 교체**

`lib/types.ts`:

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
  anthropic_api_key: string | null  // 암호화된 값 — 클라이언트에 노출 금지
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

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add lib/types.ts
git commit -m "feat: add anthropic_api_key and github_stats fields to User type"
```

---

## Task 2: 암호화 모듈

**Files:**
- Create: `lib/crypto.ts`
- Modify: `.env.local` (ENCRYPTION_KEY 추가)

- [ ] **Step 1: .env.local에 ENCRYPTION_KEY 추가**

`.env.local`에 아래 추가:

```bash
ENCRYPTION_KEY=<32바이트 랜덤 hex 문자열>
```

터미널에서 키 생성:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

출력된 64자리 hex 문자열을 값으로 사용.

- [ ] **Step 2: lib/crypto.ts 작성**

`lib/crypto.ts`:

```ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_HEX = process.env.ENCRYPTION_KEY!

if (!KEY_HEX || KEY_HEX.length !== 64) {
  // 빌드 타임에는 체크 안 함 (서버 런타임에서만 사용)
}

function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)')
  }
  return Buffer.from(KEY_HEX, 'hex')
}

/**
 * 평문 문자열을 AES-256-GCM으로 암호화.
 * 반환 형식: "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // GCM 권장 96비트
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * encrypt()로 만든 문자열을 복호화.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey()
  const [ivHex, authTagHex, dataHex] = ciphertext.split(':')
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Invalid ciphertext format')
  }
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(data).toString('utf8') + decipher.final('utf8')
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add lib/crypto.ts .env.local
git commit -m "feat: add AES-256-GCM encryption module for API key storage"
```

---

## Task 3: Settings 페이지 — API 키 관리

**Files:**
- Create: `app/(dashboard)/dashboard/settings/actions.ts`
- Create: `components/dashboard/ApiKeyForm.tsx`
- Create: `app/(dashboard)/dashboard/settings/page.tsx`

- [ ] **Step 1: Settings 서버 액션 작성**

`app/(dashboard)/dashboard/settings/actions.ts`:

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { encrypt } from '@/lib/crypto'

export async function saveApiKey(apiKey: string): Promise<void> {
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('유효하지 않은 Anthropic API 키입니다. sk-ant-로 시작해야 합니다.')
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const encrypted = encrypt(apiKey)
  const { error } = await supabase
    .from('users')
    .update({ anthropic_api_key: encrypted })
    .eq('id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/settings')
}

export async function deleteApiKey(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('users')
    .update({ anthropic_api_key: null })
    .eq('id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/settings')
}
```

- [ ] **Step 2: ApiKeyForm 클라이언트 컴포넌트 작성**

`components/dashboard/ApiKeyForm.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Key, Trash2, Eye, EyeOff, Check } from 'lucide-react'
import { saveApiKey, deleteApiKey } from '@/app/(dashboard)/dashboard/settings/actions'

type Props = {
  hasKey: boolean  // 키가 이미 등록돼 있는지 (복호화 값 노출 안 함)
}

export default function ApiKeyForm({ hasKey }: Props) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setSaving(true)
    setError(null)
    try {
      await saveApiKey(value.trim())
      setSaved(true)
      setValue('')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('API 키를 삭제하시겠습니까? GitHub 분석을 사용할 수 없게 됩니다.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteApiKey()
    } catch {
      setError('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {hasKey && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <Check size={16} className="text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-700">API 키가 등록되어 있습니다</p>
            <p className="text-xs text-emerald-600 mt-0.5">새 키를 입력하면 덮어쓰기됩니다</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={13} />
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div>
          <label htmlFor="api-key" className="text-sm font-medium text-gray-700 mb-1 block">
            Anthropic API 키
          </label>
          <p className="text-xs text-gray-500 mb-2">
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
            >
              console.anthropic.com
            </a>
            에서 발급. GitHub 분석 시 커밋 요약에 사용됩니다.
          </p>
          <div className="relative">
            <input
              id="api-key"
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving || !value.trim()}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 self-start transition-colors"
        >
          <Key size={14} />
          {saved ? '저장됨 ✓' : saving ? '저장 중...' : 'API 키 저장'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Settings 페이지 작성**

`app/(dashboard)/dashboard/settings/page.tsx`:

```tsx
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
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          AI 분석 연동
        </h2>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <ApiKeyForm hasKey={hasKey} />
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: `/dashboard/settings` 라우트 등록. 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add app/\(dashboard\)/dashboard/settings/ components/dashboard/ApiKeyForm.tsx
git commit -m "feat: add API key settings page with AES-256-GCM encryption"
```

---

## Task 4: GitHub API 헬퍼 + Anthropic 요약 모듈

**Files:**
- Create: `lib/github/api.ts`
- Create: `lib/anthropic/summarize.ts`

- [ ] **Step 1: @anthropic-ai/sdk 설치**

```bash
cd /Users/leeheewon/Documents/about-me && npm install @anthropic-ai/sdk
```

Expected: package.json에 `@anthropic-ai/sdk` 추가됨.

- [ ] **Step 2: lib/github/api.ts 작성**

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

export type GithubCommit = {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
}

// ─── 기본 fetch 헬퍼 ─────────────────────────────────────────

async function ghFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

// ─── 공개 API 함수들 ──────────────────────────────────────────

/**
 * 인증된 유저의 레포 전체 목록 (fork 제외).
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
 */
export async function fetchRepoLanguages(
  token: string,
  fullName: string
): Promise<GithubLanguages> {
  return ghFetch<GithubLanguages>(token, `/repos/${fullName}/languages`)
}

/**
 * 레포의 커밋 메시지 목록 (author 기준, 최대 200개).
 * 포트폴리오 요약에 사용할 메시지만 추출.
 */
export async function fetchRepoCommits(
  token: string,
  fullName: string,
  author: string
): Promise<string[]> {
  const messages: string[] = []
  let page = 1
  const maxPages = 2 // 200개까지 (API rate limit 고려)

  while (page <= maxPages) {
    try {
      const batch = await ghFetch<GithubCommit[]>(
        token,
        `/repos/${fullName}/commits?author=${author}&per_page=100&page=${page}`
      )
      if (batch.length === 0) break

      batch.forEach(c => {
        // 첫 번째 줄만 (subject line)
        const subject = c.commit.message.split('\n')[0].trim()
        if (subject.length > 5) messages.push(subject)
      })

      if (batch.length < 100) break
      page++
    } catch {
      break // 커밋 조회 실패해도 계속 진행
    }
  }
  return messages
}

/**
 * 유저의 전체 통계.
 */
export async function fetchUserStats(
  token: string,
  allRepos: GithubRepo[]
): Promise<{ followers: number; total_stars: number; public_repos: number }> {
  const me = await ghFetch<{ followers: number; public_repos: number }>(token, '/user')
  const total_stars = allRepos.reduce((s, r) => s + r.stargazers_count, 0)
  return { followers: me.followers, total_stars, public_repos: me.public_repos }
}

/**
 * 특정 레포에서 author가 만든 커밋 수 (Link 헤더 기반).
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
    const data = await res.json() as unknown[]
    return data.length
  } catch {
    return 0
  }
}
```

- [ ] **Step 3: lib/anthropic/summarize.ts 작성**

`lib/anthropic/summarize.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk'

export type ProjectSummary = {
  description: string        // 2-3문장 프로젝트 설명
  tech_highlights: string[]  // 주요 기술/특징 키워드 (최대 5개)
}

/**
 * 커밋 메시지 목록 + 언어 정보를 받아서
 * Claude haiku로 포트폴리오용 프로젝트 설명을 생성한다.
 */
export async function summarizeProjectFromCommits(
  apiKey: string,
  repoName: string,
  commitMessages: string[],
  languages: string[],
  repoDescription: string | null
): Promise<ProjectSummary> {
  const client = new Anthropic({ apiKey })

  const commitSample = commitMessages.slice(0, 80).join('\n')
  const langList = languages.slice(0, 8).join(', ')

  const prompt = `다음은 GitHub 레포 "${repoName}"의 커밋 내역입니다.

사용 언어: ${langList || '정보 없음'}
레포 설명: ${repoDescription || '없음'}

커밋 메시지 (최신순):
${commitSample}

위 정보를 바탕으로 개발자 포트폴리오용 프로젝트 소개를 작성해주세요.

규칙:
- description: 이 프로젝트가 무엇인지, 어떤 기능을 구현했는지 2~3문장으로 작성. 한국어로.
- tech_highlights: 커밋에서 발견되는 핵심 기술/구현 포인트 키워드 최대 5개 (짧게, 예: "JWT 인증", "실시간 채팅", "CI/CD 자동화")

JSON 형식으로만 응답 (다른 텍스트 없이):
{"description": "...", "tech_highlights": ["...", "..."]}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const parsed = JSON.parse(text) as ProjectSummary
    return {
      description: parsed.description ?? '',
      tech_highlights: Array.isArray(parsed.tech_highlights) ? parsed.tech_highlights : [],
    }
  } catch {
    // JSON 파싱 실패 시 원문 텍스트를 description으로
    return { description: text.slice(0, 300), tech_highlights: [] }
  }
}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add lib/github/api.ts lib/anthropic/summarize.ts package.json package-lock.json
git commit -m "feat: add GitHub API helpers and Claude summarization module"
```

---

## Task 5: GitHub 분석 서버 액션

**Files:**
- Create: `app/(dashboard)/dashboard/github/actions.ts`

- [ ] **Step 1: actions.ts 작성**

`app/(dashboard)/dashboard/github/actions.ts`:

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { decrypt } from '@/lib/crypto'
import {
  fetchUserRepos,
  fetchRepoLanguages,
  fetchRepoCommits,
  fetchUserStats,
  fetchRepoCommitCount,
  type GithubRepo,
} from '@/lib/github/api'
import { summarizeProjectFromCommits } from '@/lib/anthropic/summarize'

export async function getMyRepos(): Promise<GithubRepo[]> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.provider_token) {
    throw new Error('GitHub 토큰을 찾을 수 없습니다. 로그아웃 후 다시 로그인해주세요.')
  }
  return fetchUserRepos(session.provider_token)
}

export async function importSelectedRepos(repoFullNames: string[]): Promise<void> {
  if (repoFullNames.length === 0) return

  const supabase = await createClient()
  const [{ data: { session } }, { data: { user } }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ])
  if (!user || !session?.provider_token) throw new Error('Unauthorized')

  // 유저의 Anthropic API 키 복호화
  const { data: profile } = await supabase
    .from('users')
    .select('anthropic_api_key')
    .eq('id', user.id)
    .single()

  if (!profile?.anthropic_api_key) {
    throw new Error('Anthropic API 키가 등록되어 있지 않습니다. 설정에서 먼저 등록해주세요.')
  }

  const anthropicKey = decrypt(profile.anthropic_api_key)
  const token = session.provider_token
  const githubUsername = (user.user_metadata?.user_name ?? '') as string

  // ── 1. 전체 레포에서 선택된 것만 필터 ────────────────────────
  const allRepos = await fetchUserRepos(token)
  const selected = allRepos.filter(r => repoFullNames.includes(r.full_name))

  // ── 2. 각 레포: 커밋 + 언어 병렬 수집 ───────────────────────
  const languageTotals: Record<string, number> = {}

  const repoDetails = await Promise.all(
    selected.map(async repo => {
      const [languages, commits] = await Promise.all([
        fetchRepoLanguages(token, repo.full_name),
        fetchRepoCommits(token, repo.full_name, githubUsername),
      ])
      Object.entries(languages).forEach(([lang, bytes]) => {
        languageTotals[lang] = (languageTotals[lang] ?? 0) + bytes
      })
      return { repo, languages, commits }
    })
  )

  // ── 3. 프로젝트 카드 생성 (중복 skip) ───────────────────────
  for (const { repo, languages, commits } of repoDetails) {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_url', repo.html_url)
      .maybeSingle()

    if (existing) continue

    const tech_stack = Object.keys(languages).slice(0, 6)

    // Claude로 커밋 기반 설명 생성
    let description: string | null = repo.description
    try {
      const summary = await summarizeProjectFromCommits(
        anthropicKey,
        repo.name,
        commits,
        tech_stack,
        repo.description
      )
      description = summary.description || repo.description
    } catch {
      // Claude 실패 시 repo description 폴백
      description = repo.description
    }

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

  // ── 4. 스킬 생성 (언어 집계 상위 15개, 중복 skip) ───────────
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

    if (existing) continue

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

  // ── 5. GitHub 통계 저장 ──────────────────────────────────────
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

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add app/\(dashboard\)/dashboard/github/actions.ts
git commit -m "feat: add GitHub analysis server actions with Claude AI summarization"
```

---

## Task 6: GithubImporter UI + GitHub 페이지

**Files:**
- Create: `components/dashboard/GithubImporter.tsx`
- Create: `app/(dashboard)/dashboard/github/page.tsx`

- [ ] **Step 1: GithubImporter 클라이언트 컴포넌트 작성**

`components/dashboard/GithubImporter.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { GitBranch, Loader2, Check, ChevronRight, RefreshCw, Key } from 'lucide-react'
import { getMyRepos, importSelectedRepos } from '@/app/(dashboard)/dashboard/github/actions'
import type { GithubRepo } from '@/lib/github/api'

type Step = 'idle' | 'loading' | 'selecting' | 'importing' | 'done' | 'error'

type Props = {
  hasApiKey: boolean
}

export default function GithubImporter({ hasApiKey }: Props) {
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

  // API 키 없는 경우
  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center py-16 gap-4 text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
          <Key size={26} className="text-amber-500" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">Anthropic API 키가 필요합니다</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            커밋 분석 및 AI 포트폴리오 생성을 위해 먼저 API 키를 등록해주세요.
          </p>
        </div>
        <a
          href="/dashboard/settings"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Key size={15} /> 설정에서 키 등록하기
        </a>
      </div>
    )
  }

  if (step === 'idle' || step === 'error') {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center">
          <GitBranch size={26} className="text-white" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-gray-900 mb-1">GitHub 레포 분석</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            레포를 선택하면 커밋 내역을 AI가 분석해서<br />
            프로젝트 설명과 스킬을 자동으로 작성합니다.
          </p>
        </div>
        {errorMsg && <p className="text-sm text-red-500 text-center max-w-sm">{errorMsg}</p>}
        <button
          onClick={handleFetchRepos}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <GitBranch size={15} /> 레포 목록 불러오기
        </button>
      </div>
    )
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-gray-500">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">GitHub 레포 목록 불러오는 중...</p>
      </div>
    )
  }

  if (step === 'importing') {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
        <p className="text-sm text-gray-700 font-medium">AI가 커밋을 분석하고 있습니다...</p>
        <p className="text-xs text-gray-400">{selected.size}개 레포 처리 중 · 레포당 10~20초 소요</p>
      </div>
    )
  }

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
          <a href="/dashboard/projects" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
            프로젝트 확인 <ChevronRight size={14} />
          </a>
          <a href="/dashboard/skills" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
            스킬 확인 <ChevronRight size={14} />
          </a>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mt-2">
          <RefreshCw size={12} /> 다시 분석하기
        </button>
      </div>
    )
  }

  // selecting
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">레포 선택</h2>
          <p className="text-sm text-gray-500 mt-0.5">{repos.length}개 레포 · {selected.size}개 선택됨</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">취소</button>
          <button
            onClick={handleImport}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <Check size={14} /> AI 분석 시작 ({selected.size})
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
            <span className="text-[10px] text-gray-400 flex-shrink-0">★ {repo.stargazers_count}</span>
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
```

- [ ] **Step 3: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add components/dashboard/GithubImporter.tsx app/\(dashboard\)/dashboard/github/page.tsx
git commit -m "feat: add GitHub importer UI with AI analysis flow"
```

---

## Task 7: 사이드바 업데이트

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Sidebar.tsx 수정**

`components/dashboard/Sidebar.tsx`에서:

import 라인 변경:
```tsx
import { LayoutDashboard, FolderOpen, Zap, Briefcase, User, Link2, Eye, Settings, LogOut, GitBranch } from 'lucide-react'
```

`navItems` 배열 변경:
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

기존 Settings 링크(`/dashboard/settings`)는 사이드바 하단에 이미 있으므로 그대로 유지.

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/leeheewon/Documents/about-me && npm run build
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add GitHub analysis menu to sidebar"
```

---

## 셀프 리뷰 체크리스트

- [x] API 키 AES-256-GCM 암호화 저장 (iv + authTag + ciphertext 포함)
- [x] 복호화는 서버 사이드만 — 클라이언트에 평문 노출 없음
- [x] 키 미등록 시 GitHub 분석 버튼 비활성화 + 설정 페이지 안내
- [x] sk-ant- prefix 검증으로 잘못된 키 조기 차단
- [x] 커밋 메시지 200개 상한 (rate limit 보호)
- [x] Claude 실패 시 repo.description 폴백 (전체 파이프라인 중단 없음)
- [x] 중복 레포/스킬 skip (github_url / name 기준)
- [x] provider_token 없을 시 재로그인 안내

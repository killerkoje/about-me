'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { decrypt } from '@/lib/crypto'
import {
  fetchUserRepos,
  fetchRepo,
  fetchRepoLanguages,
  fetchRepoCommits,
  fetchRepoCommitsFull,
  fetchRepoReadme,
  fetchUserStats,
  fetchRepoCommitCount,
  type GithubRepo,
} from '@/lib/github/api'
import { summarizeProjectFromCommits } from '@/lib/anthropic/summarize'

async function getGithubToken(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { data } = await supabase
    .from('users')
    .select('github_token')
    .eq('id', userId)
    .single()
  if (!data?.github_token) {
    throw new Error('GitHub 토큰을 찾을 수 없습니다. 로그아웃 후 다시 로그인해주세요.')
  }
  return decrypt(data.github_token)
}

export type RepoAnalysis = {
  title: string
  description: string
  tech_stack: string[]
  github_url: string
  demo_url: string
}

export async function analyzeRepo(repoFullName: string): Promise<RepoAnalysis> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('anthropic_api_key, github_token')
    .eq('id', user.id)
    .single()

  if (!profile?.github_token) {
    throw new Error('GitHub 토큰을 찾을 수 없습니다. 로그아웃 후 다시 로그인해주세요.')
  }
  if (!profile?.anthropic_api_key) {
    throw new Error('Anthropic API 키가 없습니다. 설정에서 먼저 등록해주세요.')
  }

  const token = decrypt(profile.github_token)
  const anthropicKey = decrypt(profile.anthropic_api_key)
  const githubUsername = (user.user_metadata?.user_name ?? '') as string

  const [languages, commits, repo, readme] = await Promise.all([
    fetchRepoLanguages(token, repoFullName),
    fetchRepoCommits(token, repoFullName, githubUsername),
    fetchRepo(token, repoFullName),
    fetchRepoReadme(token, repoFullName),
  ])

  const tech_stack = Object.keys(languages).slice(0, 8)
  const repoName = repoFullName.split('/')[1]

  let description = repo.description ?? ''

  try {
    const summary = await summarizeProjectFromCommits(
      anthropicKey,
      repoName,
      commits,
      tech_stack,
      repo.description ?? null,
      readme
    )
    if (summary.description) {
      const highlights = summary.tech_highlights.length > 0
        ? `\n\n주요 구현: ${summary.tech_highlights.join(' · ')}`
        : ''
      description = summary.description + highlights
    }
  } catch {
    // Claude 실패 시 기본값 사용
  }

  return {
    title: repoName,
    description,
    tech_stack,  // 언어 이름 유지
    github_url: repo.html_url,
    demo_url: repo.homepage ?? '',
  }
}

export type CommitItem = {
  sha: string
  message: string
  author: string
  date: string
}

export type CommitPageResult = {
  commits: CommitItem[]
  page: number
  perPage: number
  hasMore: boolean
}

export async function getRepoCommitsPaged(
  repoFullName: string,
  page: number = 1,
  perPage: number = 30
): Promise<CommitPageResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const token = await getGithubToken(supabase, user.id)
  const githubUsername = (user.user_metadata?.user_name ?? '') as string

  const batch = await fetchRepoCommitsFull(token, repoFullName, githubUsername, page, perPage)
  return {
    commits: batch.map(c => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0].trim(),
      author: c.commit.author.name,
      date: c.commit.author.date,
    })),
    page,
    perPage,
    hasMore: batch.length === perPage,
  }
}

export async function getMyRepos(): Promise<GithubRepo[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const token = await getGithubToken(supabase, user.id)
  return fetchUserRepos(token)
}

// ── 1단계: GitHub 데이터 수집 ─────────────────────────────────

export type RepoRawData = {
  repoName: string
  fullName: string
  description: string | null
  htmlUrl: string
  homepage: string | null
  languages: Record<string, number>
  commits: string[]
  readme: string | null
}

export async function fetchReposData(repoFullNames: string[]): Promise<RepoRawData[]> {
  if (repoFullNames.length === 0) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const token = await getGithubToken(supabase, user.id)
  const githubUsername = (user.user_metadata?.user_name ?? '') as string

  const allRepos = await fetchUserRepos(token)
  const selected = allRepos.filter(r => repoFullNames.includes(r.full_name))

  return Promise.all(
    selected.map(async repo => {
      const [languages, commits, readme] = await Promise.all([
        fetchRepoLanguages(token, repo.full_name),
        fetchRepoCommits(token, repo.full_name, githubUsername),
        fetchRepoReadme(token, repo.full_name),
      ])
      return {
        repoName: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        homepage: repo.homepage,
        languages,
        commits,
        readme,
      }
    })
  )
}

// ── 2단계: AI 분석 + 저장 ─────────────────────────────────────

export type RepoImportResult = {
  repoName: string
  description: string
  tech_stack: string[]
  skipped: boolean
}

export async function analyzeAndSaveRepos(rawData: RepoRawData[]): Promise<RepoImportResult[]> {
  if (rawData.length === 0) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('anthropic_api_key, github_token')
    .eq('id', user.id)
    .single()

  if (!profile?.anthropic_api_key) {
    throw new Error('Anthropic API 키가 등록되어 있지 않습니다. 설정에서 먼저 등록해주세요.')
  }
  if (!profile?.github_token) {
    throw new Error('GitHub 토큰을 찾을 수 없습니다. 로그아웃 후 다시 로그인해주세요.')
  }

  const anthropicKey = decrypt(profile.anthropic_api_key)
  const token = decrypt(profile.github_token)
  const githubUsername = (user.user_metadata?.user_name ?? '') as string

  const languageTotals: Record<string, number> = {}
  const results: RepoImportResult[] = []

  for (const repo of rawData) {
    Object.entries(repo.languages).forEach(([lang, bytes]) => {
      languageTotals[lang] = (languageTotals[lang] ?? 0) + (bytes as number)
    })

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_url', repo.htmlUrl)
      .maybeSingle()

    if (existing) {
      results.push({ repoName: repo.repoName, description: '', tech_stack: [], skipped: true })
      continue
    }

    const tech_stack = Object.keys(repo.languages).slice(0, 6)
    let description: string = repo.description ?? ''

    try {
      const summary = await summarizeProjectFromCommits(
        anthropicKey,
        repo.repoName,
        repo.commits,
        tech_stack,
        repo.description,
        repo.readme
      )
      if (summary.description) {
        const highlights = summary.tech_highlights.length > 0
          ? `\n\n주요 구현: ${summary.tech_highlights.join(' · ')}`
          : ''
        description = summary.description + highlights
      }
    } catch {
      // Claude 실패 시 기본값
    }

    await supabase.from('projects').insert({
      user_id: user.id,
      title: repo.repoName,
      description: description || null,
      tech_stack,
      github_url: repo.htmlUrl,
      demo_url: repo.homepage || null,
      status: 'live' as const,
      order: 0,
    })

    results.push({ repoName: repo.repoName, description, tech_stack, skipped: false })
  }

  // 스킬 집계
  const sortedLangs = Object.entries(languageTotals).sort(([, a], [, b]) => b - a).slice(0, 15)
  const totalBytes = sortedLangs.reduce((s, [, b]) => s + b, 0)

  for (const [lang, bytes] of sortedLangs) {
    const { data: existing } = await supabase
      .from('skills').select('id').eq('user_id', user.id).eq('name', lang).maybeSingle()
    if (existing) continue
    const ratio = totalBytes > 0 ? bytes / totalBytes : 0
    const level = Math.max(20, Math.min(95, Math.round(ratio * 300)))
    await supabase.from('skills').insert({ user_id: user.id, name: lang, category: 'language' as const, level, order: 0 })
  }

  // GitHub 통계
  const allRepos = await fetchUserRepos(token)
  const selectedRepos = allRepos.filter(r => rawData.some(d => d.fullName === r.full_name))
  const [userStats, commitCounts] = await Promise.all([
    fetchUserStats(token, allRepos),
    Promise.all(selectedRepos.map(r => fetchRepoCommitCount(token, r.full_name, githubUsername))),
  ])
  const total_commits = commitCounts.reduce((s, c) => s + c, 0)
  const top_languages = sortedLangs.slice(0, 5).map(([name]) => name)

  await supabase.from('users').update({
    github_stats: { total_commits, stars: userStats.total_stars, followers: userStats.followers, top_languages },
  }).eq('id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/skills')
  revalidatePath('/dashboard/github')

  return results
}

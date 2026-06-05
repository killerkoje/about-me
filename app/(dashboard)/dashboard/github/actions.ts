'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { decrypt } from '@/lib/crypto'
import {
  fetchUserRepos,
  fetchRepo,
  fetchRepoLanguages,
  fetchRepoCommits,
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

  const [languages, commits, repo] = await Promise.all([
    fetchRepoLanguages(token, repoFullName),
    fetchRepoCommits(token, repoFullName, githubUsername),
    fetchRepo(token, repoFullName),
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
      repo.description ?? null
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

export async function getMyRepos(): Promise<GithubRepo[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const token = await getGithubToken(supabase, user.id)
  return fetchUserRepos(token)
}

export type RepoImportResult = {
  repoName: string
  description: string
  tech_stack: string[]
  skipped: boolean
}

export async function importSelectedRepos(repoFullNames: string[]): Promise<RepoImportResult[]> {
  if (repoFullNames.length === 0) return []

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

  const allRepos = await fetchUserRepos(token)
  const selected = allRepos.filter(r => repoFullNames.includes(r.full_name))

  const languageTotals: Record<string, number> = {}
  const results: RepoImportResult[] = []

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

  for (const { repo, languages, commits } of repoDetails) {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_url', repo.html_url)
      .maybeSingle()

    if (existing) {
      results.push({ repoName: repo.name, description: '', tech_stack: [], skipped: true })
      continue
    }

    const tech_stack = Object.keys(languages).slice(0, 6)
    let description: string = repo.description ?? ''

    try {
      const summary = await summarizeProjectFromCommits(
        anthropicKey,
        repo.name,
        commits,
        tech_stack,
        repo.description
      )
      if (summary.description) {
        // 서술 + 구현 포인트를 description에 합침
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
      title: repo.name,
      description: description || null,
      tech_stack,  // 언어 이름 그대로 유지
      github_url: repo.html_url,
      demo_url: repo.homepage || null,
      status: 'live' as const,
      order: 0,
    })

    results.push({ repoName: repo.name, description, tech_stack, skipped: false })
  }

  // 스킬 집계
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

  // GitHub 통계 업데이트
  const [userStats, commitCounts] = await Promise.all([
    fetchUserStats(token, allRepos),
    Promise.all(selected.map(r => fetchRepoCommitCount(token, r.full_name, githubUsername))),
  ])
  const total_commits = commitCounts.reduce((s, c) => s + c, 0)
  const top_languages = Object.entries(languageTotals)
    .sort(([, a], [, b]) => b - a).slice(0, 5).map(([name]) => name)

  await supabase.from('users').update({
    github_stats: { total_commits, stars: userStats.total_stars, followers: userStats.followers, top_languages },
  }).eq('id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/skills')
  revalidatePath('/dashboard/github')

  return results
}

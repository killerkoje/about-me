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

  const allRepos = await fetchUserRepos(token)
  const selected = allRepos.filter(r => repoFullNames.includes(r.full_name))

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

  for (const { repo, languages, commits } of repoDetails) {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_url', repo.html_url)
      .maybeSingle()

    if (existing) continue

    const tech_stack = Object.keys(languages).slice(0, 6)

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

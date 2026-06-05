const BASE_URL = 'https://api.github.com'

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

/**
 * Authenticated user's repos (forks excluded).
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
 * Language byte counts for a repo.
 */
export async function fetchRepoLanguages(
  token: string,
  fullName: string
): Promise<GithubLanguages> {
  return ghFetch<GithubLanguages>(token, `/repos/${fullName}/languages`)
}

/**
 * Commit subject lines for a repo (author-filtered, max 200).
 */
export async function fetchRepoCommits(
  token: string,
  fullName: string,
  author: string
): Promise<string[]> {
  const messages: string[] = []
  let page = 1
  const maxPages = 2

  while (page <= maxPages) {
    try {
      const batch = await ghFetch<GithubCommit[]>(
        token,
        `/repos/${fullName}/commits?author=${author}&per_page=100&page=${page}`
      )
      if (batch.length === 0) break
      batch.forEach(c => {
        const subject = c.commit.message.split('\n')[0].trim()
        if (subject.length > 5) messages.push(subject)
      })
      if (batch.length < 100) break
      page++
    } catch {
      break
    }
  }
  return messages
}

/**
 * User stats: followers, total stars, public repos.
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
 * Commit count for a repo via Link header pagination.
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

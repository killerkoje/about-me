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

export type FileTreeEntry = {
  path: string
  type: 'blob' | 'tree'
  size?: number
}

/**
 * Full recursive file tree for a repo.
 */
export async function fetchFileTree(
  token: string,
  fullName: string,
  branch: string
): Promise<FileTreeEntry[]> {
  try {
    const data = await ghFetch<{ tree: FileTreeEntry[]; truncated: boolean }>(
      token,
      `/repos/${fullName}/git/trees/${branch}?recursive=1`
    )
    return data.tree.filter(e => e.type === 'blob')
  } catch {
    return []
  }
}

/**
 * Single file content decoded from base64. Returns null on error.
 */
export async function fetchFileContent(
  token: string,
  fullName: string,
  path: string
): Promise<string | null> {
  try {
    const data = await ghFetch<{ content: string; encoding: string; size: number }>(
      token,
      `/repos/${fullName}/contents/${path.split('/').map(encodeURIComponent).join('/')}`
    )
    if (data.encoding === 'base64') {
      return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8')
    }
    return null
  } catch {
    return null
  }
}

/**
 * README.md content (decoded from base64). Returns null if not found.
 */
export async function fetchRepoReadme(token: string, fullName: string): Promise<string | null> {
  try {
    const data = await ghFetch<{ content: string; encoding: string }>(token, `/repos/${fullName}/readme`)
    if (data.encoding === 'base64') {
      return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8').slice(0, 3000)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Single repo info.
 */
export async function fetchRepo(token: string, fullName: string): Promise<GithubRepo> {
  return ghFetch<GithubRepo>(token, `/repos/${fullName}`)
}

/**
 * Authenticated user's repos via REST (owner / collaborator / org member).
 */
export async function fetchUserRepos(token: string): Promise<GithubRepo[]> {
  const all: GithubRepo[] = []
  let page = 1
  while (true) {
    const batch = await ghFetch<GithubRepo[]>(
      token,
      `/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member&visibility=all`
    )
    all.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return all
}

type GraphQLContribResult = {
  user: {
    contributionsCollection: {
      commitContributionsByRepository: Array<{
        repository: {
          databaseId: number
          nameWithOwner: string
          name: string
          description: string | null
          url: string
          homepageUrl: string | null
          primaryLanguage: { name: string } | null
          stargazerCount: number
          isFork: boolean
          isPrivate: boolean
          defaultBranchRef: { name: string } | null
          updatedAt: string
        }
      }>
    }
  }
}

const CONTRIB_QUERY = `
  query ContributedRepos($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            databaseId
            nameWithOwner
            name
            description
            url
            homepageUrl
            primaryLanguage { name }
            stargazerCount
            isFork
            isPrivate
            defaultBranchRef { name }
            updatedAt
          }
        }
      }
    }
  }
`

async function ghGraphQL<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`)
  const json = await res.json() as { data?: T; errors?: Array<{ message: string }> }
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}

/**
 * Repos the user has committed to (last 3 years), via GraphQL contributionsCollection.
 * Covers repos not in REST /user/repos (e.g. orgs without explicit collaborator access).
 */
export async function fetchContributedRepos(token: string, username: string): Promise<GithubRepo[]> {
  const now = new Date()
  const yearRanges = [0, 1, 2].map(i => {
    const to = new Date(now)
    to.setFullYear(now.getFullYear() - i)
    const from = new Date(to)
    from.setFullYear(to.getFullYear() - 1)
    return { from: from.toISOString(), to: to.toISOString() }
  })

  const results = await Promise.all(
    yearRanges.map(({ from, to }) =>
      ghGraphQL<GraphQLContribResult>(token, CONTRIB_QUERY, { login: username, from, to }).catch(() => null)
    )
  )

  const repoMap = new Map<string, GithubRepo>()
  for (const result of results) {
    if (!result) continue
    for (const { repository: r } of result.user.contributionsCollection.commitContributionsByRepository) {
      if (!repoMap.has(r.nameWithOwner)) {
        repoMap.set(r.nameWithOwner, {
          id: r.databaseId,
          name: r.name,
          full_name: r.nameWithOwner,
          description: r.description,
          html_url: r.url,
          homepage: r.homepageUrl,
          language: r.primaryLanguage?.name ?? null,
          stargazers_count: r.stargazerCount,
          fork: r.isFork,
          private: r.isPrivate,
          default_branch: r.defaultBranchRef?.name ?? 'main',
          updated_at: r.updatedAt,
        })
      }
    }
  }
  return [...repoMap.values()]
}

/**
 * All repos accessible to the user: REST affiliations + GraphQL contribution history.
 */
export async function fetchAllAccessibleRepos(token: string, username: string): Promise<GithubRepo[]> {
  const [restRepos, contribRepos] = await Promise.all([
    fetchUserRepos(token),
    fetchContributedRepos(token, username).catch(() => [] as GithubRepo[]),
  ])

  const map = new Map<string, GithubRepo>()
  for (const r of [...restRepos, ...contribRepos]) {
    if (!map.has(r.full_name)) map.set(r.full_name, r)
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
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
 * Full commit objects for a repo — single page, author-filtered.
 */
export async function fetchRepoCommitsFull(
  token: string,
  fullName: string,
  author: string,
  page: number = 1,
  perPage: number = 30
): Promise<GithubCommit[]> {
  try {
    return await ghFetch<GithubCommit[]>(
      token,
      `/repos/${fullName}/commits?author=${author}&per_page=${perPage}&page=${page}`
    )
  } catch {
    return []
  }
}

/**
 * Commit subject lines for a repo (author-filtered, max 500).
 */
export async function fetchRepoCommits(
  token: string,
  fullName: string,
  author: string
): Promise<string[]> {
  const messages: string[] = []
  let page = 1
  const maxPages = 5

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

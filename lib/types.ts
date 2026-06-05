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

# 포트폴리오 플랫폼 — 코어 구현 계획 (Plan 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub OAuth 로그인, 포트폴리오 CRUD 대시보드, 공개 포트폴리오 페이지(`/username`)가 동작하는 완전한 서비스를 구축한다.

**Architecture:** Next.js App Router로 SSR 공개 페이지와 클라이언트 대시보드를 분리. Supabase Auth로 GitHub OAuth 처리, RLS로 데이터 권한 제어. 공개 페이지는 Server Component로 SEO 자동 처리.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL + Auth + Storage), Tailwind CSS, @dnd-kit/core (드래그앤드롭), Vitest + React Testing Library

---

## 파일 구조

```
app/
  (auth)/login/page.tsx           # GitHub 로그인 페이지
  (dashboard)/dashboard/
    layout.tsx                    # 사이드바 레이아웃 (인증 필수)
    page.tsx                      # 대시보드 메인
    projects/page.tsx             # 프로젝트 관리
    skills/page.tsx               # 스킬 관리
    career/page.tsx               # 경력 관리
    about/page.tsx                # 소개 관리
  [username]/page.tsx             # 공개 포트폴리오 (SSR)
  api/auth/callback/route.ts      # GitHub OAuth 콜백

components/
  dashboard/
    Sidebar.tsx                   # 사이드바 네비게이션
    ProfileHero.tsx               # 프로필 헤더 (편집 가능)
    ProjectCard.tsx               # 프로젝트 카드 (편집 모드)
    ProjectForm.tsx               # 프로젝트 추가/수정 폼
    SkillCard.tsx                 # 스킬 카드 (편집 모드)
    SkillForm.tsx                 # 스킬 추가/수정 폼
    CareerCard.tsx                # 경력 카드 (편집 모드)
    CareerForm.tsx                # 경력 추가/수정 폼
    SortableList.tsx              # 드래그앤드롭 래퍼
  portfolio/
    PortfolioProfileHero.tsx      # 프로필 헤더 (읽기 전용)
    PortfolioProjectCard.tsx      # 프로젝트 카드 (읽기 전용)
    PortfolioSkillCard.tsx        # 스킬 카드 (읽기 전용)
    PortfolioCareerCard.tsx       # 경력 카드 (읽기 전용)

lib/
  supabase/
    client.ts                     # 브라우저 클라이언트
    server.ts                     # 서버 클라이언트 (cookies)
  auth/
    middleware.ts                 # 인증 미들웨어 헬퍼
  types.ts                        # 공유 타입 정의

middleware.ts                     # /dashboard/* 보호
```

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `.env.local.example`, `tailwind.config.ts`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  lucide-react

npm install -D vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom
```

- [ ] **Step 3: `.env.local.example` 작성**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.local`도 동일하게 복사 후 실제 값 입력 (Supabase 대시보드에서 확인).

- [ ] **Step 4: vitest 설정**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

`vitest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

`package.json` scripts에 추가:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: 동작 확인**

```bash
npm run dev
```
Expected: `http://localhost:3000` 접속 시 Next.js 기본 페이지 표시.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Supabase and testing setup"
```

---

## Task 2: Supabase 스키마 & RLS

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Supabase 프로젝트 생성**

[app.supabase.com](https://app.supabase.com) 에서 새 프로젝트 생성.
Settings → API에서 `URL`과 `anon key` 복사 → `.env.local`에 입력.

- [ ] **Step 2: SQL 마이그레이션 파일 작성**

`supabase/migrations/001_initial_schema.sql`:
```sql
-- users 테이블 (auth.users와 연동)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  name text,
  avatar_url text,
  bio text,
  location text,
  github_url text,
  email text,
  is_open_to_work boolean default false,
  created_at timestamptz default now()
);

-- projects 테이블
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  tech_stack text[] default '{}',
  github_url text,
  demo_url text,
  thumbnail text,
  status text default 'wip' check (status in ('live', 'wip', 'archived')),
  "order" integer default 0,
  created_at timestamptz default now()
);

-- skills 테이블
create table public.skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  category text default 'language' check (category in ('language', 'framework', 'tool')),
  level integer default 50 check (level between 1 and 100),
  "order" integer default 0
);

-- careers 테이블
create table public.careers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  company text not null,
  role text not null,
  start_date date,
  end_date date,
  description text,
  "order" integer default 0
);

-- RLS 활성화
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.careers enable row level security;

-- users RLS
create policy "users_select_all" on public.users for select using (true);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- projects RLS
create policy "projects_select_all" on public.projects for select using (true);
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);

-- skills RLS
create policy "skills_select_all" on public.skills for select using (true);
create policy "skills_insert_own" on public.skills for insert with check (auth.uid() = user_id);
create policy "skills_update_own" on public.skills for update using (auth.uid() = user_id);
create policy "skills_delete_own" on public.skills for delete using (auth.uid() = user_id);

-- careers RLS
create policy "careers_select_all" on public.careers for select using (true);
create policy "careers_insert_own" on public.careers for insert with check (auth.uid() = user_id);
create policy "careers_update_own" on public.careers for update using (auth.uid() = user_id);
create policy "careers_delete_own" on public.careers for delete using (auth.uid() = user_id);

-- 최초 로그인 시 users 레코드 자동 생성 trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, username, name, avatar_url, email, github_url)
  values (
    new.id,
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    'https://github.com/' || (new.raw_user_meta_data->>'user_name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 3: Supabase SQL Editor에서 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 전체 붙여넣기 → Run.
Expected: 에러 없이 완료.

- [ ] **Step 4: 예약 username 처리**

Supabase SQL Editor에서 추가 실행:
```sql
-- username 예약어 제한 (login, dashboard, api 등 경로 충돌 방지)
alter table public.users
  add constraint username_not_reserved
  check (username not in ('login', 'dashboard', 'api', 'admin', 'settings', 'about'));
```

- [ ] **Step 5: 커밋**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with RLS and auth trigger"
```

---

## Task 3: Supabase 클라이언트 & 타입

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: 타입 정의 작성**

`lib/types.ts`:
```ts
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
```

- [ ] **Step 2: 타입 테스트 (컴파일 확인)**

```bash
npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 3: 브라우저 클라이언트 작성**

`lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: 서버 클라이언트 작성**

`lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 5: 커밋**

```bash
git add lib/
git commit -m "feat: add Supabase client helpers and shared types"
```

---

## Task 4: GitHub OAuth & 미들웨어

**Files:**
- Create: `app/api/auth/callback/route.ts`
- Create: `middleware.ts`
- Create: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Supabase에서 GitHub OAuth 설정**

1. Supabase 대시보드 → Authentication → Providers → GitHub 활성화
2. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `https://<supabase-project>.supabase.co/auth/v1/callback`
3. Client ID와 Client Secret을 Supabase GitHub provider에 입력.

- [ ] **Step 2: OAuth 콜백 라우트 작성**

`app/api/auth/callback/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

- [ ] **Step 3: 미들웨어 작성**

`middleware.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /dashboard/* 보호
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 로그인 상태에서 /login 접근 시 대시보드로
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
```

- [ ] **Step 4: 로그인 페이지 작성**

`app/(auth)/login/page.tsx`:
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">devfolio</h1>
        <p className="text-gray-500 text-sm mb-8">개발자 포트폴리오 플랫폼</p>
        <button
          onClick={signInWithGitHub}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white rounded-xl px-4 py-3 font-medium hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub으로 로그인
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 동작 확인**

```bash
npm run dev
```
`http://localhost:3000/login` → GitHub 버튼 클릭 → GitHub 인증 → `/dashboard` 리다이렉트 확인.

- [ ] **Step 6: 커밋**

```bash
git add app/ middleware.ts
git commit -m "feat: add GitHub OAuth login and dashboard route protection"
```

---

## Task 5: 대시보드 레이아웃 & 사이드바

**Files:**
- Create: `app/(dashboard)/dashboard/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`
- Create: `components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Sidebar 컴포넌트 작성**

`components/dashboard/Sidebar.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Zap, Briefcase, User, Link2, Eye, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드', exact: true },
  { href: '/dashboard/projects', icon: FolderOpen, label: '프로젝트' },
  { href: '/dashboard/skills', icon: Zap, label: '스킬' },
  { href: '/dashboard/career', icon: Briefcase, label: '경력' },
  { href: '/dashboard/about', icon: User, label: '소개' },
]

const publicItems = [
  { href: '/dashboard/share', icon: Link2, label: '링크 공유' },
]

export default function Sidebar({ username }: { username: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col py-5 px-3">
      <div className="px-3 mb-6">
        <span className="text-base font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          devfolio
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pb-1.5 pt-2">관리</p>
        {navItems.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(href, exact)
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pb-1.5 pt-4">공개 페이지</p>
        {publicItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(href)
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
        <Link
          href={`/${username}`}
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Eye size={15} />
          미리보기
        </Link>
      </nav>

      <div className="border-t border-gray-100 pt-3 mt-3 flex flex-col gap-0.5">
        <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          <Settings size={15} />설정
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 w-full text-left"
        >
          <LogOut size={15} />로그아웃
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: 대시보드 레이아웃 작성**

`app/(dashboard)/dashboard/layout.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar username={profile?.username ?? ''} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: 대시보드 메인 페이지 (플레이스홀더)**

`app/(dashboard)/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
      <p className="text-gray-500 text-sm mt-1">포트폴리오를 관리하세요.</p>
    </div>
  )
}
```

- [ ] **Step 4: 동작 확인**

```bash
npm run dev
```
로그인 후 `/dashboard` → 사이드바 + 메인 영역 렌더링 확인.

- [ ] **Step 5: 커밋**

```bash
git add app/ components/
git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

## Task 6: 프로젝트 CRUD

**Files:**
- Create: `components/dashboard/ProjectCard.tsx`
- Create: `components/dashboard/ProjectForm.tsx`
- Create: `app/(dashboard)/dashboard/projects/page.tsx`
- Create: `app/(dashboard)/dashboard/projects/actions.ts`

- [ ] **Step 1: Server Actions 작성**

`app/(dashboard)/dashboard/projects/actions.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Project } from '@/lib/types'

export async function createProject(data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'order'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('projects').insert({ ...data, user_id: user.id })
  if (error) throw error
  revalidatePath('/dashboard/projects')
}

export async function updateProject(id: string, data: Partial<Project>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('projects').update(data).eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/projects')
}

export async function deleteProject(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/projects')
}

export async function updateProjectOrder(ids: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await Promise.all(
    ids.map((id, index) =>
      supabase.from('projects').update({ order: index }).eq('id', id).eq('user_id', user.id)
    )
  )
  revalidatePath('/dashboard/projects')
}
```

- [ ] **Step 2: ProjectForm 컴포넌트 작성**

`components/dashboard/ProjectForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import type { Project } from '@/lib/types'

type Props = {
  initial?: Partial<Project>
  onSubmit: (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'order'>) => Promise<void>
  onCancel: () => void
}

export default function ProjectForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [techInput, setTechInput] = useState(initial?.tech_stack?.join(', ') ?? '')
  const [githubUrl, setGithubUrl] = useState(initial?.github_url ?? '')
  const [demoUrl, setDemoUrl] = useState(initial?.demo_url ?? '')
  const [status, setStatus] = useState<Project['status']>(initial?.status ?? 'wip')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        title,
        description: description || null,
        tech_stack: techInput.split(',').map(t => t.trim()).filter(Boolean),
        github_url: githubUrl || null,
        demo_url: demoUrl || null,
        thumbnail: null,
        status,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        required value={title} onChange={e => setTitle(e.target.value)}
        placeholder="프로젝트 이름 *"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <textarea
        value={description} onChange={e => setDescription(e.target.value)}
        placeholder="설명"
        rows={3}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
      />
      <input
        value={techInput} onChange={e => setTechInput(e.target.value)}
        placeholder="기술스택 (쉼표로 구분: React, Node.js)"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <input
        value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
        placeholder="GitHub URL"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <input
        value={demoUrl} onChange={e => setDemoUrl(e.target.value)}
        placeholder="데모 URL"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <select
        value={status} onChange={e => setStatus(e.target.value as Project['status'])}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <option value="live">Live</option>
        <option value="wip">WIP</option>
        <option value="archived">Archived</option>
      </select>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">취소</button>
        <button
          type="submit" disabled={loading}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: ProjectCard 컴포넌트 작성**

`components/dashboard/ProjectCard.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Pencil, Trash2, GripVertical, ExternalLink } from 'lucide-react'
import type { Project } from '@/lib/types'
import ProjectForm from './ProjectForm'
import { updateProject, deleteProject } from '@/app/(dashboard)/dashboard/projects/actions'

const statusLabels = { live: 'Live', wip: 'WIP', archived: 'Archived' }
const statusColors = {
  live: 'bg-emerald-50 text-emerald-600',
  wip: 'bg-amber-50 text-amber-600',
  archived: 'bg-gray-100 text-gray-500',
}

export default function ProjectCard({ project, dragHandle }: { project: Project; dragHandle?: React.ReactNode }) {
  const [editing, setEditing] = useState(false)

  async function handleUpdate(data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'order'>) {
    await updateProject(project.id, data)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white border border-indigo-200 rounded-xl p-4">
        <ProjectForm initial={project} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-colors group">
      <div className="flex items-start gap-2">
        <div className="text-gray-300 cursor-grab mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {dragHandle ?? <GripVertical size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{project.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
              {statusLabels[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">{project.description}</p>
          )}
          {project.tech_stack.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {project.tech_stack.map(t => (
                <span key={t} className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-600">{t}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
                <ExternalLink size={10} /> GitHub
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
                <ExternalLink size={10} /> Demo
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <Pencil size={13} />
          </button>
          <button onClick={() => deleteProject(project.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 프로젝트 페이지 작성**

`app/(dashboard)/dashboard/projects/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectCard from '@/components/dashboard/ProjectCard'
import AddProjectButton from '@/components/dashboard/AddProjectButton'

export default async function ProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('order')

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">프로젝트</h1>
          <p className="text-gray-500 text-sm mt-0.5">{projects?.length ?? 0}개의 프로젝트</p>
        </div>
        <AddProjectButton />
      </div>
      <div className="flex flex-col gap-3">
        {projects?.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {(!projects || projects.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-12">아직 프로젝트가 없어요. 추가해보세요!</p>
        )}
      </div>
    </div>
  )
}
```

`components/dashboard/AddProjectButton.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import ProjectForm from './ProjectForm'
import { createProject } from '@/app/(dashboard)/dashboard/projects/actions'

export default function AddProjectButton() {
  const [open, setOpen] = useState(false)

  if (open) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
          <h2 className="font-semibold text-gray-900 mb-4">프로젝트 추가</h2>
          <ProjectForm
            onSubmit={async data => { await createProject(data); setOpen(false) }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm"
    >
      <Plus size={15} /> 추가
    </button>
  )
}
```

- [ ] **Step 5: 동작 확인**

```bash
npm run dev
```
`/dashboard/projects` → 프로젝트 추가 → 카드 렌더링 → 수정/삭제 확인.

- [ ] **Step 6: 커밋**

```bash
git add app/ components/
git commit -m "feat: add projects CRUD with server actions"
```

---

## Task 7: 스킬 & 경력 CRUD

**Files:**
- Create: `app/(dashboard)/dashboard/skills/page.tsx`
- Create: `app/(dashboard)/dashboard/skills/actions.ts`
- Create: `app/(dashboard)/dashboard/career/page.tsx`
- Create: `app/(dashboard)/dashboard/career/actions.ts`
- Create: `components/dashboard/SkillCard.tsx`
- Create: `components/dashboard/CareerCard.tsx`

- [ ] **Step 1: 스킬 Server Actions**

`app/(dashboard)/dashboard/skills/actions.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Skill } from '@/lib/types'

export async function createSkill(data: Omit<Skill, 'id' | 'user_id' | 'order'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('skills').insert({ ...data, user_id: user.id })
  if (error) throw error
  revalidatePath('/dashboard/skills')
}

export async function updateSkill(id: string, data: Partial<Skill>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('skills').update(data).eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/skills')
}

export async function deleteSkill(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('skills').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/skills')
}
```

- [ ] **Step 2: SkillCard 컴포넌트**

`components/dashboard/SkillCard.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Skill } from '@/lib/types'
import { updateSkill, deleteSkill } from '@/app/(dashboard)/dashboard/skills/actions'

const categoryLabels = { language: '언어', framework: '프레임워크', tool: '툴' }

export default function SkillCard({ skill }: { skill: Skill }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(skill.name)
  const [level, setLevel] = useState(skill.level)
  const [category, setCategory] = useState(skill.category)

  async function handleSave() {
    await updateSkill(skill.id, { name, level, category })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white border border-indigo-200 rounded-xl p-4 flex flex-col gap-3">
        <input value={name} onChange={e => setName(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="스킬명" />
        <select value={category} onChange={e => setCategory(e.target.value as Skill['category'])} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="language">언어</option>
          <option value="framework">프레임워크</option>
          <option value="tool">툴</option>
        </select>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">숙련도: {level}</label>
          <input type="range" min={1} max={100} value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full accent-indigo-600" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5">취소</button>
          <button onClick={handleSave} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg">저장</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group hover:border-indigo-200 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-semibold text-sm text-gray-900">{skill.name}</span>
          <span className="ml-2 text-[10px] text-gray-400">{categoryLabels[skill.category]}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil size={13} /></button>
          <button onClick={() => deleteSkill(skill.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${skill.level}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 스킬 페이지**

`app/(dashboard)/dashboard/skills/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SkillCard from '@/components/dashboard/SkillCard'
import AddSkillButton from '@/components/dashboard/AddSkillButton'

export default async function SkillsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: skills } = await supabase.from('skills').select('*').eq('user_id', user.id).order('order')

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">기술 스택</h1>
          <p className="text-gray-500 text-sm mt-0.5">{skills?.length ?? 0}개의 스킬</p>
        </div>
        <AddSkillButton />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {skills?.map(skill => <SkillCard key={skill.id} skill={skill} />)}
        {(!skills || skills.length === 0) && (
          <p className="col-span-2 text-gray-400 text-sm text-center py-12">스킬을 추가해보세요!</p>
        )}
      </div>
    </div>
  )
}
```

`components/dashboard/AddSkillButton.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createSkill } from '@/app/(dashboard)/dashboard/skills/actions'

export default function AddSkillButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState(50)
  const [category, setCategory] = useState<'language' | 'framework' | 'tool'>('language')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createSkill({ name, level, category })
    setOpen(false); setName(''); setLevel(50)
  }

  if (open) return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
      <form className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-gray-900 mb-4">스킬 추가</h2>
        <div className="flex flex-col gap-3">
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="스킬명 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <select value={category} onChange={e => setCategory(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="language">언어</option>
            <option value="framework">프레임워크</option>
            <option value="tool">툴</option>
          </select>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">숙련도: {level}</label>
            <input type="range" min={1} max={100} value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full accent-indigo-600" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 px-3 py-1.5">취소</button>
            <button type="submit" className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg">저장</button>
          </div>
        </div>
      </form>
    </div>
  )

  return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm">
      <Plus size={15} /> 추가
    </button>
  )
}
```

- [ ] **Step 4: 경력 Server Actions**

`app/(dashboard)/dashboard/career/actions.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Career } from '@/lib/types'

export async function createCareer(data: Omit<Career, 'id' | 'user_id' | 'order'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('careers').insert({ ...data, user_id: user.id })
  if (error) throw error
  revalidatePath('/dashboard/career')
}

export async function updateCareer(id: string, data: Partial<Career>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('careers').update(data).eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/career')
}

export async function deleteCareer(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('careers').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/career')
}
```

- [ ] **Step 5: CareerCard & 경력 페이지**

`components/dashboard/CareerCard.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Career } from '@/lib/types'
import { updateCareer, deleteCareer } from '@/app/(dashboard)/dashboard/career/actions'

function formatDate(date: string | null) {
  if (!date) return '현재'
  return new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' })
}

function calcDuration(start: string | null, end: string | null) {
  if (!start) return ''
  const s = new Date(start), e = end ? new Date(end) : new Date()
  const months = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth()
  const y = Math.floor(months / 12), m = months % 12
  return [y > 0 && `${y}년`, m > 0 && `${m}개월`].filter(Boolean).join(' ')
}

export default function CareerCard({ career }: { career: Career }) {
  const [editing, setEditing] = useState(false)
  const [company, setCompany] = useState(career.company)
  const [role, setRole] = useState(career.role)
  const [startDate, setStartDate] = useState(career.start_date ?? '')
  const [endDate, setEndDate] = useState(career.end_date ?? '')
  const [description, setDescription] = useState(career.description ?? '')

  async function handleSave() {
    await updateCareer(career.id, { company, role, start_date: startDate || null, end_date: endDate || null, description: description || null })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white border border-indigo-200 rounded-xl p-4 flex flex-col gap-3">
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="회사명 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="직책 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-gray-500 mb-1 block">입사일</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">퇴사일 (공백=현재)</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="담당 업무" rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5">취소</button>
          <button onClick={handleSave} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg">저장</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group hover:border-indigo-200 transition-colors flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900">{career.company}</div>
        <div className="text-xs text-indigo-600 font-medium">{career.role}</div>
        <div className="text-xs text-gray-400 mt-0.5">{formatDate(career.start_date)} — {formatDate(career.end_date)}</div>
      </div>
      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{calcDuration(career.start_date, career.end_date)}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil size={13} /></button>
        <button onClick={() => deleteCareer(career.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}
```

`app/(dashboard)/dashboard/career/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CareerCard from '@/components/dashboard/CareerCard'
import AddCareerButton from '@/components/dashboard/AddCareerButton'

export default async function CareerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: careers } = await supabase.from('careers').select('*').eq('user_id', user.id).order('order')

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">경력</h1>
          <p className="text-gray-500 text-sm mt-0.5">{careers?.length ?? 0}개의 경력</p>
        </div>
        <AddCareerButton />
      </div>
      <div className="flex flex-col gap-3">
        {careers?.map(career => <CareerCard key={career.id} career={career} />)}
        {(!careers || careers.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-12">경력을 추가해보세요!</p>
        )}
      </div>
    </div>
  )
}
```

`components/dashboard/AddCareerButton.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createCareer } from '@/app/(dashboard)/dashboard/career/actions'

export default function AddCareerButton() {
  const [open, setOpen] = useState(false)
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createCareer({ company, role, start_date: startDate || null, end_date: endDate || null, description: description || null })
    setOpen(false); setCompany(''); setRole(''); setStartDate(''); setEndDate(''); setDescription('')
  }

  if (open) return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
      <form className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-3" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-gray-900 mb-1">경력 추가</h2>
        <input required value={company} onChange={e => setCompany(e.target.value)} placeholder="회사명 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <input required value={role} onChange={e => setRole(e.target.value)} placeholder="직책 *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-gray-500 mb-1 block">입사일</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">퇴사일 (공백=현재)</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="담당 업무" rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 px-3 py-1.5">취소</button>
          <button type="submit" className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg">저장</button>
        </div>
      </form>
    </div>
  )

  return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-sm">
      <Plus size={15} /> 추가
    </button>
  )
}
```

- [ ] **Step 6: 동작 확인**

```bash
npm run dev
```
`/dashboard/skills`, `/dashboard/career` 접속 → 추가/수정/삭제 확인.

- [ ] **Step 7: 커밋**

```bash
git add app/ components/
git commit -m "feat: add skills and career CRUD"
```

---

## Task 8: 소개 & 프로필 편집

**Files:**
- Create: `app/(dashboard)/dashboard/about/page.tsx`
- Create: `app/(dashboard)/dashboard/about/actions.ts`

- [ ] **Step 1: 소개 Server Action**

`app/(dashboard)/dashboard/about/actions.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { User } from '@/lib/types'

export async function updateProfile(data: Partial<Pick<User, 'name' | 'bio' | 'location' | 'is_open_to_work'>>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('users').update(data).eq('id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/about')
  revalidatePath('/dashboard')
}
```

- [ ] **Step 2: 소개 페이지**

`app/(dashboard)/dashboard/about/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AboutForm from '@/components/dashboard/AboutForm'

export default async function AboutPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">소개</h1>
      {profile && <AboutForm profile={profile} />}
    </div>
  )
}
```

`components/dashboard/AboutForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import type { User } from '@/lib/types'
import { updateProfile } from '@/app/(dashboard)/dashboard/about/actions'

export default function AboutForm({ profile }: { profile: User }) {
  const [name, setName] = useState(profile.name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [isOpenToWork, setIsOpenToWork] = useState(profile.is_open_to_work)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await updateProfile({ name, bio, location, is_open_to_work: isOpenToWork })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">이름</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">한 줄 소개</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Full-Stack Developer · 사용자 경험을 중시하는 개발자입니다." rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">위치</label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Seoul, Korea" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={isOpenToWork} onChange={e => setIsOpenToWork(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
        <span className="text-sm text-gray-700">구직 중 배지 표시</span>
      </label>
      <button
        type="submit" disabled={saving}
        className="bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 self-start transition-colors"
      >
        {saved ? '✓ 저장됨' : saving ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: 동작 확인 및 커밋**

```bash
npm run dev
```
`/dashboard/about` → 이름/소개/위치 수정 후 저장 → DB 반영 확인.

```bash
git add app/ components/
git commit -m "feat: add profile/about editing"
```

---

## Task 9: 공개 포트폴리오 페이지 (SSR)

**Files:**
- Create: `app/[username]/page.tsx`
- Create: `components/portfolio/PortfolioProfileHero.tsx`
- Create: `components/portfolio/PortfolioProjectCard.tsx`
- Create: `components/portfolio/PortfolioSkillCard.tsx`
- Create: `components/portfolio/PortfolioCareerCard.tsx`

- [ ] **Step 1: 공개 포트폴리오 컴포넌트 작성**

`components/portfolio/PortfolioProfileHero.tsx`:
```tsx
import type { User } from '@/lib/types'
import { MapPin, Github } from 'lucide-react'

export default function PortfolioProfileHero({ user }: { user: User }) {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center gap-5 text-white shadow-lg">
      {user.avatar_url && (
        <img src={user.avatar_url} alt={user.name ?? ''} className="w-16 h-16 rounded-full border-2 border-white/40 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold mb-1">{user.name ?? user.username}</h1>
        {user.bio && <p className="text-white/80 text-sm mb-2">{user.bio}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          {user.location && <span className="flex items-center gap-1 text-xs text-white/70"><MapPin size={11} />{user.location}</span>}
          {user.github_url && <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-white/70 hover:text-white"><Github size={11} />GitHub</a>}
          {user.is_open_to_work && <span className="text-[10px] bg-emerald-400/20 border border-emerald-400/40 px-2 py-0.5 rounded-full">✓ 구직중</span>}
        </div>
      </div>
    </div>
  )
}
```

`components/portfolio/PortfolioProjectCard.tsx`:
```tsx
import type { Project } from '@/lib/types'
import { ExternalLink, Github } from 'lucide-react'

const statusColors = { live: 'bg-emerald-50 text-emerald-600', wip: 'bg-amber-50 text-amber-600', archived: 'bg-gray-100 text-gray-500' }

export default function PortfolioProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-indigo-200 hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{project.title}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>{project.status === 'live' ? 'Live' : project.status === 'wip' ? 'WIP' : 'Archived'}</span>
      </div>
      {project.description && <p className="text-sm text-gray-500 mb-3 leading-relaxed">{project.description}</p>}
      {project.tech_stack.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {project.tech_stack.map(t => <span key={t} className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-600">{t}</span>)}
        </div>
      )}
      <div className="flex gap-3">
        {project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-500 hover:underline"><Github size={11} />GitHub</a>}
        {project.demo_url && <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-500 hover:underline"><ExternalLink size={11} />Demo</a>}
      </div>
    </div>
  )
}
```

`components/portfolio/PortfolioSkillCard.tsx`:
```tsx
import type { Skill } from '@/lib/types'
const categoryLabels = { language: '언어', framework: '프레임워크', tool: '툴' }

export default function PortfolioSkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-gray-900">{skill.name}</span>
        <span className="text-[10px] text-gray-400">{categoryLabels[skill.category]}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${skill.level}%` }} />
      </div>
    </div>
  )
}
```

`components/portfolio/PortfolioCareerCard.tsx`:
```tsx
import type { Career } from '@/lib/types'
function formatDate(date: string | null) { return date ? new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' }) : '현재' }
function calcDuration(start: string | null, end: string | null) {
  if (!start) return ''
  const s = new Date(start), e = end ? new Date(end) : new Date()
  const months = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth()
  const y = Math.floor(months / 12), m = months % 12
  return [y > 0 && `${y}년`, m > 0 && `${m}개월`].filter(Boolean).join(' ')
}

export default function PortfolioCareerCard({ career }: { career: Career }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-gray-900">{career.company}</div>
        <div className="text-xs text-indigo-600 font-medium">{career.role}</div>
        <div className="text-xs text-gray-400 mt-0.5">{formatDate(career.start_date)} — {formatDate(career.end_date)}</div>
      </div>
      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{calcDuration(career.start_date, career.end_date)}</span>
    </div>
  )
}
```

- [ ] **Step 2: 공개 포트폴리오 페이지 작성**

`app/[username]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import PortfolioProfileHero from '@/components/portfolio/PortfolioProfileHero'
import PortfolioProjectCard from '@/components/portfolio/PortfolioProjectCard'
import PortfolioSkillCard from '@/components/portfolio/PortfolioSkillCard'
import PortfolioCareerCard from '@/components/portfolio/PortfolioCareerCard'

type Props = { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: user } = await supabase.from('users').select('name, bio, avatar_url').eq('username', params.username).single()
  if (!user) return { title: '404' }
  return {
    title: `${user.name ?? params.username} | devfolio`,
    description: user.bio ?? `${user.name ?? params.username}의 개발자 포트폴리오`,
    openGraph: {
      title: `${user.name ?? params.username} | devfolio`,
      description: user.bio ?? '',
      images: user.avatar_url ? [user.avatar_url] : [],
    },
  }
}

export default async function PortfolioPage({ params }: Props) {
  const supabase = createClient()

  const { data: user } = await supabase.from('users').select('*').eq('username', params.username).single()
  if (!user) notFound()

  const [{ data: projects }, { data: skills }, { data: careers }] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', user.id).neq('status', 'archived').order('order'),
    supabase.from('skills').select('*').eq('user_id', user.id).order('order'),
    supabase.from('careers').select('*').eq('user_id', user.id).order('order'),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 h-12 flex items-center">
        <span className="font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">devfolio</span>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        <PortfolioProfileHero user={user} />
        {projects && projects.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">🚀 프로젝트</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map(p => <PortfolioProjectCard key={p.id} project={p} />)}
            </div>
          </section>
        )}
        {skills && skills.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">⚡ 기술 스택</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {skills.map(s => <PortfolioSkillCard key={s.id} skill={s} />)}
            </div>
          </section>
        )}
        {careers && careers.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">💼 경력</h2>
            <div className="flex flex-col gap-3">
              {careers.map(c => <PortfolioCareerCard key={c.id} career={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 동작 확인**

```bash
npm run dev
```
`http://localhost:3000/<본인GitHub유저명>` → 포트폴리오 페이지 렌더링 확인.
`curl -I http://localhost:3000/<유저명>` → HTML 응답 (SSR) 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/ components/
git commit -m "feat: add public portfolio page with SSR and OpenGraph meta"
```

---

## Task 10: 대시보드 메인 & 링크 복사

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Create: `app/(dashboard)/dashboard/share/page.tsx`

- [ ] **Step 1: 대시보드 메인 완성**

`app/(dashboard)/dashboard/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, Zap, Briefcase, User } from 'lucide-react'
import CopyLinkButton from '@/components/dashboard/CopyLinkButton'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: projectCount }, { count: skillCount }, { count: careerCount }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('skills').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('careers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const portfolioUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${profile?.username}`

  const sections = [
    { label: '프로젝트', count: projectCount ?? 0, href: '/dashboard/projects', icon: FolderOpen, color: 'text-indigo-500 bg-indigo-50' },
    { label: '스킬', count: skillCount ?? 0, href: '/dashboard/skills', icon: Zap, color: 'text-violet-500 bg-violet-50' },
    { label: '경력', count: careerCount ?? 0, href: '/dashboard/career', icon: Briefcase, color: 'text-blue-500 bg-blue-50' },
    { label: '소개', count: null, href: '/dashboard/about', icon: User, color: 'text-pink-500 bg-pink-50' },
  ]

  return (
    <div className="p-6 max-w-3xl">
      {profile && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center gap-4 text-white mb-6 shadow-lg">
          {profile.avatar_url && <img src={profile.avatar_url} className="w-14 h-14 rounded-full border-2 border-white/30" alt="" />}
          <div>
            <h1 className="text-lg font-bold">{profile.name ?? profile.username}</h1>
            {profile.bio && <p className="text-white/75 text-sm mt-0.5">{profile.bio}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {sections.map(({ label, count, href, icon: Icon, color }) => (
          <Link key={href} href={href} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:-translate-y-0.5 transition-all shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}><Icon size={16} /></div>
            {count !== null && <div className="text-xl font-bold text-gray-900">{count}</div>}
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">내 포트폴리오 링크</p>
          <p className="text-sm font-mono text-indigo-600 font-medium truncate">{portfolioUrl}</p>
        </div>
        <CopyLinkButton url={portfolioUrl} />
        <Link href={`/${profile?.username}`} target="_blank" className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap">미리보기 →</Link>
      </div>
    </div>
  )
}
```

`components/dashboard/CopyLinkButton.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">
      {copied ? <><Check size={12} />복사됨</> : <><Copy size={12} />링크 복사</>}
    </button>
  )
}
```

- [ ] **Step 2: 동작 확인 및 커밋**

```bash
npm run dev
```
대시보드 메인 → 통계 카드 표시 → 링크 복사 버튼 동작 확인.

```bash
git add app/ components/
git commit -m "feat: complete dashboard main page with stats and copy link"
```

---

## Task 11: Vercel 배포

**Files:**
- Modify: `.env.local.example`

- [ ] **Step 1: GitHub 레포에 푸시**

```bash
git push origin main
```

- [ ] **Step 2: Vercel 프로젝트 연결**

1. [vercel.com](https://vercel.com) → New Project → GitHub 레포 선택
2. Framework: Next.js (자동 감지)
3. Environment Variables 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://<vercel-domain>.vercel.app`

- [ ] **Step 3: Supabase OAuth 콜백 URL 업데이트**

GitHub OAuth App → Callback URL에 Vercel 도메인 추가:
`https://<vercel-domain>.vercel.app/api/auth/callback`

Supabase → Authentication → URL Configuration:
- Site URL: `https://<vercel-domain>.vercel.app`
- Redirect URLs: `https://<vercel-domain>.vercel.app/api/auth/callback`

- [ ] **Step 4: 배포 확인**

Vercel 대시보드에서 빌드 성공 확인.
`https://<vercel-domain>.vercel.app/login` → GitHub 로그인 → 대시보드 접근 확인.

- [ ] **Step 5: 커밋**

```bash
git add .env.local.example
git commit -m "docs: update env example with production variables"
```

---

## 셀프 리뷰 체크리스트

스펙 기준 커버리지:
- [x] GitHub OAuth 로그인
- [x] 프로젝트 CRUD
- [x] 스킬 CRUD
- [x] 경력 CRUD
- [x] 소개 수정
- [x] 공개 포트폴리오 페이지 (SSR)
- [x] OpenGraph / SEO 메타
- [x] 링크 복사 버튼
- [x] Vercel 배포
- [ ] 카드 순서 변경 (drag & drop) — Plan 2에서 구현
- [ ] 이미지 업로드 — Plan 2에서 구현
- [ ] username 변경 — Plan 2에서 구현

drag & drop, 이미지 업로드, username 변경은 GitHub 연동 Plan과 함께 Plan 2에서 처리.

# 개발자 포트폴리오 플랫폼 — 설계 문서

**작성일:** 2026-06-05  
**상태:** 확정

---

## 1. 개요

개발자 누구나 사용할 수 있는 포트폴리오 관리 플랫폼. GitHub 로그인 후 프로젝트, 스킬, 경력, 소개를 관리하면 고유 URL(`/username`)로 포트폴리오가 공개된다. GitHub 레포 분석으로 대부분의 데이터를 자동으로 채울 수 있는 것이 핵심 차별점. 광고 없이 지인 중심으로 공유되는 소규모 플랫폼으로 운영 예정.

---

## 2. 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js (App Router) |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth + GitHub OAuth |
| 파일 저장 | Supabase Storage |
| 배포 | Vercel |
| 백그라운드 처리 | Supabase Edge Functions |

---

## 3. 아키텍처

```
app/
├── (auth)/
│   └── login/               # GitHub 로그인 페이지
├── (dashboard)/
│   └── dashboard/           # 관리 대시보드 (인증 필요)
│       ├── page.tsx          # 메인 대시보드
│       ├── projects/         # 프로젝트 관리
│       ├── skills/           # 스킬 관리
│       ├── career/           # 경력 관리
│       └── about/            # 소개 관리
├── [username]/               # 공개 포트폴리오 (누구나 접근)
│   └── page.tsx              # Server Component — SEO 완비
└── api/
    └── auth/callback/        # GitHub OAuth 콜백

components/
├── dashboard/                # 관리용 컴포넌트 (편집 가능)
└── portfolio/                # 공개용 컴포넌트 (읽기 전용)

lib/
├── supabase/
│   ├── client.ts             # 브라우저 클라이언트
│   └── server.ts             # 서버 클라이언트
├── github/
│   └── api.ts                # GitHub API 호출 헬퍼
└── auth/
    └── helpers.ts            # 세션 유틸
```

**핵심 흐름:**
- `/:username` → Server Component가 Supabase에서 조회 → SSR 렌더링 → SEO, 오픈그래프 자동
- `/dashboard` → GitHub 로그인 필수 → 본인 데이터만 CRUD 가능
- GitHub 분석 → Edge Function이 백그라운드 처리 → 완료 후 대시보드에 반영

---

## 4. 데이터베이스 스키마

```sql
-- 유저
users
  id               uuid        PK (Supabase auth.users 연동)
  username         text        UNIQUE NOT NULL  -- URL slug, GitHub username 기본값
  name             text
  avatar_url       text
  bio              text
  location         text
  github_url       text
  email            text
  is_open_to_work  boolean     DEFAULT false
  github_stats     jsonb       -- { total_commits, stars, followers, top_languages, commit_streak }
  created_at       timestamp

-- 프로젝트
projects
  id           uuid        PK
  user_id      uuid        FK → users
  title        text        NOT NULL
  description  text
  tech_stack   text[]      -- ['React', 'Node.js', 'PostgreSQL']
  github_url   text
  demo_url     text
  thumbnail    text        -- Supabase Storage URL
  status       text        -- 'live' | 'wip' | 'archived'
  order        integer     -- 카드 순서
  created_at   timestamp

-- 스킬
skills
  id        uuid     PK
  user_id   uuid     FK → users
  name      text     NOT NULL
  category  text     -- 'language' | 'framework' | 'tool'
  level     integer  -- 1~100
  order     integer

-- 경력
careers
  id           uuid     PK
  user_id      uuid     FK → users
  company      text     NOT NULL
  role         text     NOT NULL
  start_date   date
  end_date     date     -- NULL = 현재 재직 중
  description  text
  order        integer
```

**RLS 정책:**
- `SELECT` → 전체 공개 (공개 포트폴리오 조회)
- `INSERT / UPDATE / DELETE` → `auth.uid() = user_id` 인 경우만 허용

---

## 5. 페이지 & 기능

### 공개 포트폴리오 `/:username`
- Server Component로 SSR 렌더링
- 메타태그 / 오픈그래프 자동 생성 (LinkedIn 링크 공유 시 미리보기)
- 구성: 프로필 헤더 → 프로젝트 카드 → 스킬 → 경력
- 존재하지 않는 username → 404

### 로그인 `/login`
- GitHub OAuth 버튼 하나
- 최초 로그인 시 GitHub username으로 slug 자동 설정

### 대시보드 `/dashboard`
- 사이드바 + 카드 레이아웃 (라이트 테마, 인디고/바이올렛 계열)
- 각 섹션: 추가 / 수정 / 삭제 / 순서 변경 (drag & drop)
- 상단 "미리보기" 버튼 → 내 공개 페이지로 이동
- 링크 복사 버튼

### GitHub 분석
- 대시보드에서 "GitHub 분석 시작" 버튼 클릭
- Supabase Edge Function이 백그라운드에서 처리:
  1. 레포 목록 조회 → 사용자가 선택 → 프로젝트 카드 자동 생성
  2. 전체 레포 언어 사용량 집계 → 스킬 자동 채움
  3. 스타, 팔로워, 총 커밋 수 → 프로필 스탯 표시
  4. 선택된 레포 README 파싱 → 프로젝트 설명 자동 입력
  5. 전체 커밋 히스토리 분석 → 활동 요약 저장 (원본 미저장, 결과만)
- 분석 완료 후 대시보드 자동 갱신

---

## 6. MVP 기능 범위

| 기능 | MVP |
|---|---|
| GitHub 로그인 | ✅ |
| 프로젝트 CRUD | ✅ |
| 스킬 CRUD | ✅ |
| 경력 CRUD | ✅ |
| 소개 수정 | ✅ |
| 카드 순서 변경 (drag & drop) | ✅ |
| 공개 포트폴리오 페이지 (SSR) | ✅ |
| 오픈그래프 / SEO | ✅ |
| 링크 복사 버튼 | ✅ |
| username 변경 | ✅ |
| 프로필/프로젝트 이미지 업로드 | ✅ Supabase Storage |
| GitHub 레포 임포트 → 프로젝트 자동 생성 | ✅ |
| 언어 사용량 → 스킬 자동 분석 | ✅ |
| GitHub 스탯 (스타, 팔로워, 커밋) | ✅ |
| README 파싱 → 프로젝트 설명 | ✅ |
| 커밋 히스토리 분석 (결과만 저장) | ✅ |
| 다크모드 토글 | ❌ MVP 이후 |
| 커스텀 도메인 | ❌ MVP 이후 |

---

## 7. 비용 추산

| 규모 | 유저 수 | 월 비용 |
|---|---|---|
| 런칭 초기 | 0 ~ 500명 | $0 |
| 성장기 | 500 ~ 3,000명 | $25 |
| 중규모 | 3,000 ~ 10,000명 | $45 |

- GitHub API: 유저 본인 토큰 사용 → 서버 비용 없음
- Supabase Edge Functions: 500,000회/월 무료 → 수천 명까지 커버
- 커밋 분석 데이터: 결과값만 저장 → 유저당 수 KB, DB 부담 없음

---

## 8. 디자인

- 테마: 라이트 모드, 흰 배경
- 색상: 인디고 (#6366f1) / 바이올렛 (#8b5cf6) 계열
- 레이아웃: 사이드바 + 카드 기반 대시보드
- 공개 페이지: 관리 대시보드와 동일 레이아웃, 편집 UI만 제거
- 목업 파일: `.superpowers/brainstorm/` 참고

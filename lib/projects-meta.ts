export type ProjectDetail = {
  title: string
  points: string[]
}

export type ProjectMeta = {
  description: string
  highlights: string[]
  details: ProjectDetail[]
}

export const PROJECT_META: Record<string, ProjectMeta> = {
  vogopang_front: {
    description: '보고팡 프론트엔드 — 플레이어 성능 개선 및 Web Vitals 최적화 담당',
    highlights: [
      '청크 기반 오디오 레이지 로딩 구현',
      'Lighthouse 자동화 성능 측정 환경 구축',
      'Next.js Image 최적화 (WebP·CLS 개선)',
      'Web Vitals 로깅 시스템 구축',
    ],
    details: [
      {
        title: '1. 청크 기반 오디오 레이지 로딩 구현',
        points: [
          'content-hub 청크 API를 연동해 /player/work 진입 시 첫 번째 청크(chunk 0)만 먼저 로드하도록 초기 로드 전략 변경',
          '재생 중일 때만 5초 lookahead 단위로 다음 청크를 백그라운드 프리패치하는 인터벌 방식 적용',
          'S3 URL에 절대 경로 prefix가 이중으로 붙는 버그를 URL 정규화 헬퍼(chunkHub.ts)로 수정',
          '재생 클릭 시점에 pendingStartMs 기준으로 chunk_index를 계산해 즉시 패치하고, merge → append 순서로 오디오를 붙인 뒤 재생이 시작되도록 흐름 재설계',
          'React 상태 업데이트 지연을 피하기 위해 useRef 기반으로 청크 패칭 중 로딩 상태를 관리해 렌더링 블로킹 없이 즉시 재생 가능한 상태로 전환',
        ],
      },
      {
        title: '2. Lighthouse 기반 성능 측정 환경 구축',
        points: [
          'Slow 4G / Fast 4G 네트워크 프리셋 기반 Lighthouse 자동화 스크립트 설계 및 구축',
          'scripts/run-lighthouse-network.mjs — 네트워크 스로틀링 프리셋 적용 단일/전체 실행',
          '결과를 baseline.md에 자동 갱신, 원시 JSON은 .gitignore 제외',
          'Slow 4G 기준 Performance 96점, FCP 2239ms / Fast 4G 100점, FCP 1208ms 베이스라인 수립',
          '측정 결과를 Notion DB와 연동해 팀 공유 환경 구성',
        ],
      },
      {
        title: '3. Next.js Image 최적화',
        points: [
          'format: image/webp 강제 적용으로 PNG/JPEG 대비 평균 30~50% 용량 절감',
          'deviceSizes: Tailwind 브레이크포인트와 실제 컴포넌트 사용 너비(393 홈 히어로, 528 그리드 등)에 맞춰 커스텀 정의 — 불필요한 srcset 후보 제거',
          'imageSizes: 아이콘·썸네일 실제 사용 폭(16~256px)을 기반으로 세분화',
          'minimumCacheTTL: S3 URL 기반 이미지는 URL 변경 시 자연 무효화되는 특성을 고려해 캐시 TTL 상향 (기본값 1초 → 60초)',
        ],
      },
      {
        title: '4. CLS 개선 — 로고 레이아웃 시프트 수정',
        points: [
          'Footer.tsx의 로고 컨테이너에 고정 사이즈(h-7 w-[133px] md:h-9 md:w-[172px])를 명시해 이미지 로드 전후 공간을 사전 확보',
          '로고 이미지 높이값 고정 적용으로 CLS 수치 개선',
        ],
      },
      {
        title: '5. Web Vitals 로깅 시스템 구축',
        points: [
          'src/app/vitals/api/route.ts — 도메인별 / 날짜별 로그 파일 분기 저장',
          'rating이 good 미만일 경우 analysis 배열에 원인 항목 추가하여 어느 지표가 왜 나쁜지 추적 가능',
          '무한 호출 버그 수정으로 안정적 수집 보장',
        ],
      },
      {
        title: '6. 멀티테넌트 도메인 연동',
        points: [
          '/auth/trial Origin 기반 조회로 교체',
          '유효하지 않은 도메인 401 / 404를 invalid-library 흐름으로 일원화',
          'deprecated된 subdomain 파서 코드 정리',
        ],
      },
    ],
  },
  pudding_front: {
    description: '푸딩툰 프론트엔드 — 콘텐츠 도메인 전반 UI 구현 및 성능 최적화 담당',
    highlights: [
      '웹툰/보이스툰/아티스트/MUSIC 도메인 페이지 전체 구현',
      'React Query 전면 도입 및 서버 컴포넌트 전환으로 번들 최적화',
      '미디어 플레이어 버그 수정 및 UX 개선',
      '320px 기준 모바일/태블릿/데스크톱 반응형 UI 구축',
    ],
    details: [
      {
        title: '1. 콘텐츠 도메인 페이지 개발',
        points: [
          '웹툰/보이스툰 상세 페이지 전체 UI 구현 — 정보탭, 이벤트 영역, 댓글/답글, 구매 다이얼로그',
          '아티스트 페이지 전체 구현 — 메인 배너, 전체보기, 상세 페이지, 참여 작품 탭 구조',
          'MUSIC 도메인 신설 — OST 파일 구조 설계, 이달의 신곡 UI, 수록곡 리스트, 최신곡 API 연동',
          '시리즈 상세 페이지 — 관련 앨범 섹션 추가, 코멘트 API 연동 및 신고/삭제 기능',
          '에피소드 리스트에서 미구매 콘텐츠 자물쇠 아이콘 처리 (hasTicket 매핑)',
        ],
      },
      {
        title: '2. 회원/인증 기능',
        points: [
          '회원가입 UI 구현, 유효성 검사, 기능 연동',
          '이메일 인증 API 연동',
          '비밀번호 찾기/아이디 찾기 페이지 UI',
          '로그인 계정 관리/설정 페이지 및 토글, 비밀번호 변경 페이지 완성',
          '성인인증 — 미완료 계정 다이얼로그 팝업 분기 처리',
        ],
      },
      {
        title: '3. 마이페이지 & 더보기',
        points: [
          '마이페이지 전체 UI — 내 서재, 소장/찜한 작품, 팔로우, 최근 본 순 정렬 팝업',
          '드래그 앤 드롭 편집 기능 구현 (내 서재)',
          '찜한 작품 알림 아이콘 토글, 소장 작품 섹션 구분',
          '커뮤니티 홈/상세/댓글/답글/페이지네이션 구현',
          '공통 신고 훅 & 모델 생성 — 웹툰, 아티스트, 커뮤니티 전역 신고 기능 적용',
          '고객센터 FAQ, 문의/불편접수, 나의 문의 내역/상세, 공지사항 페이지 구현',
        ],
      },
      {
        title: '4. 성능 최적화',
        points: [
          'Dynamic import + Lazy Section으로 홈 초기 번들 경량화',
          '내 서재 비가시 섹션 dynamic import 적용',
          'next/image + sharp 적용으로 이미지 처리 성능 향상',
          '빌드 후 Lighthouse 성능 측정 파이프라인 구성',
          'React Query 전면 도입 (refactor 10건) — 홈 검색, Top10, 이달의 신작, 이벤트, 팔로우, 문의 삭제 등',
          '서버 컴포넌트 전환으로 클라이언트 번들 감소',
          'useSearchParams 사용 부분 Suspense 처리 (빌드 에러 해결)',
        ],
      },
      {
        title: '5. 반응형 UI (모바일 / 태블릿 / 데스크톱)',
        points: [
          '320px 기준 비율 확장 배너 — 아티스트, 보이스툰, 시리즈 상세 상단 배너',
          '모바일/태블릿/데스크톱 limit 분기 처리',
          '커뮤니티, 아티스트, 더보기, 충전 페이지 등 태블릿 UI 대응',
        ],
      },
      {
        title: '6. 미디어 플레이어',
        points: [
          '미니플레이어 — 라우팅 오류 해결, 이미지 드래그 방지, 하단 shadow 처리',
          '홀데이(hole day) 시작 시점 margin 계산 적용',
          '플레이어 버튼 위치 및 CSS 중첩 구조 수정',
          '최신곡/MUSIC 섹션 재생버튼 중복 클릭 방지',
          '모바일 재생버튼 호버 오류 수정',
        ],
      },
      {
        title: '7. 기타',
        points: [
          'Cursor AI 룰셋 적용 (.cursor 설정)',
          'gtag(Google Analytics) 곡별 듣기/담기 이벤트 적용',
        ],
      },
    ],
  },
}

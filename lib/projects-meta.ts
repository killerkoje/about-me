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
}

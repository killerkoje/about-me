export type ProjectDetail = {
  title: string
  points: string[]
}

export type ProjectMeta = {
  description: string
  highlights: string[]
  details: ProjectDetail[]
}

export type CompanyProject = {
  name: string
  language?: string
}

// 회사 레포는 GitHub 토큰 계정에서 보이지 않을 수 있어 이력서 순서대로 고정한다.
export const COMPANY_PROJECTS: CompanyProject[] = [
  { name: 'ad-variant-agent', language: 'TypeScript' },
  { name: 'erp_chatbot', language: 'TypeScript' },
  { name: 'ax_workflow' },
  { name: 'harness_build', language: 'Python' },
  { name: 'vogopang_front', language: 'TypeScript' },
  { name: 'dubright_front', language: 'Vue' },
  { name: 'pudding_front', language: 'TypeScript' },
]

export const PROJECT_META: Record<string, ProjectMeta> = {
  'ad-variant-agent': {
    description:
      '원정대 AI/AX 혁신팀 · PSD 원본 재현 렌더(Skia)·LaMa 여백 확장·페르소나 카피로 광고 이미지를 대량 재생산하는 에이전트 (하루 150~200장 → 600~700장)',
    highlights: [
      'PSD 서체·글자별 색·자간·레이어 효과 직접 파싱 → Skia 원본 재현 렌더로 Adobe 라이선스 의존 제거',
      '비율 변경 시 제품 위치 고정·여백만 LaMa 확장, 세이프 영역 검사 실패 시 자동 거절',
      '검수자가 고른 카피를 지식베이스에 축적해 다음 생성 근거로 재사용 — 쓸수록 품질 상승',
      '하루 생산량 150~200장 → 600~700장 (약 3~4배)',
    ],
    details: [
      {
        title: '프로젝트 개요',
        points: [
          '기간: 2026.09 — 진행중 (운영 중)',
          '역할: 단독 기획·설계·개발·운영',
          '기술: Next.js · FastAPI · Skia · LaMa · Claude Code',
          '마케터는 자연어 한 줄로 변주를 뽑고, 검수자는 쓸 장만 선택하는 흐름',
        ],
      },
      {
        title: '문제 정의',
        points: [
          '배너 변주는 포토샵에서 PSD를 직접 수정해야 해 Adobe 라이선스가 전제였고, 수작업이라 하루 150~200장이 한계',
          '다른 연령·성별을 공략하려면 기존 소재를 재활용하지 못하고 처음부터 다시 기획해야 했음',
          '목표: PSD 파일만으로 ① 배너 비율 변경 ② 문구 교체를 라이선스 없이 대량 생산하고, ③ 소재의 타겟 세그먼트 자체를 전환',
        ],
      },
      {
        title: '1. PSD 원본 재현 렌더',
        points: [
          'PSD의 서체·글자별 색·자간·레이어 효과를 직접 파싱해 Skia로 원본 재현 렌더',
          '포토샵 없이 비율 변경·문구 교체 처리 — Adobe 의존 제거',
        ],
      },
      {
        title: '2. 비율 변경·타겟 전환',
        points: [
          '비율 변경은 제품 위치를 고정하고 여백만 LaMa 인페인팅으로 확장',
          '세이프 영역 검사에서 불가하면 결과를 내지 않고 거절',
          '상품 URL·이미지·텍스트를 읽어 페르소나 기반으로 카피와 이미지 소재를 함께 재생성',
        ],
      },
      {
        title: '3. AI 오작동 통제',
        points: [
          '모델 권한 최소화 — 모델은 문구·서체·소재 선택만 결정',
          'AI가 제품·서체를 왜곡하지 않도록 렌더·검사 단계를 코드로 고정',
          '검사 실패 시 자동 거절',
        ],
      },
      {
        title: '4. 쓸수록 품질이 올라가는 구조',
        points: [
          '광고 도메인 직접 학습(제일기획 등 대행사 자료, 토스애즈 공개 카피 프롬프팅 작성법) → 프롬프트·페르소나 설계에 반영',
          '검수자가 고른 카피를 지식베이스에 적재해 다음 생성의 근거로 재사용',
          '검수자의 선택 자체를 품질 신호로 사용 — 쓰면 쓸수록 카피 품질이 올라감',
        ],
      },
      {
        title: '5. 성과',
        points: [
          '비용 — 비율 변경·문구 교체를 Adobe 라이선스 없이 처리해 해당 작업의 라이선스·외주 비용 제거',
          '생산량 — 하루 150~200장 → 600~700장 (약 3~4배)',
          '매출 기회 — 10대 여성 타겟 소재를 60대 남성 타겟의 이미지·문구로 전환, PSD 자산 하나로 다른 세그먼트 공략',
          '타겟별 소재 실험 횟수 제약 해소 (이전에는 불가능)',
        ],
      },
      {
        title: '6. 다음 단계',
        points: ['광고 심사 자동화(정책 위반 탐지·반려 사유 생성) 설계 중'],
      },
    ],
  },
  erp_chatbot: {
    description:
      '원정대 AI/AX 혁신팀 · 수십 개 테이블 규모 사내 CRM을 직원이 자연어로 조회하는 챗봇 — 응답 77.1s → 29.0s (내부 테스트 기준)',
    highlights: [
      '직원이 검증한 질문·SQL을 지식베이스로 축적, bge-m3 의미+키워드 하이브리드 검색으로 재활용',
      '별도 벡터 DB 없이 PostgreSQL로 구현',
      '읽기 전용 SQL 가드·업무 범위 제한, 도구 호출 형식 오류 서버 보정 (도구 실패 0건)',
      '구간별 실측으로 병목 특정 → 응답 77.1s→29.0s, 첫 글자 6.8s→2.5s',
    ],
    details: [
      {
        title: '프로젝트 개요',
        points: [
          '기간: 2026.10 — 진행중 (내부 테스트 중)',
          '역할: 단독 설계·개발',
          '기술: React · TypeScript · PostgreSQL · MySQL · bge-m3 · Claude Code',
          '수십 개 테이블 규모의 사내 CRM을 직원이 자연어로 조회 — 전사 사용 규모 기준으로 설계',
        ],
      },
      {
        title: '1. 검증 사례 지식베이스',
        points: [
          '직원이 검증한 질문·SQL을 사내 지식베이스로 축적',
          '의미+키워드 하이브리드 검색(bge-m3)으로 비슷한 검증 사례를 답변에 활용',
          '별도 벡터 DB 없이 PostgreSQL로 구현',
        ],
      },
      {
        title: '2. AI 오작동 통제',
        points: [
          '읽기 전용 SQL 가드·업무 범위 제한',
          '도구 호출 형식 오류를 서버에서 보정 — 내부 테스트 기준 도구 실패 0건',
        ],
      },
      {
        title: '3. 응답 속도 개선',
        points: [
          '문제: 자연어 질문 하나에 응답까지 77초가 걸려 실사용이 어려운 상태',
          '구간별 지연 실측으로 모델 대기가 99.9%임을 확인',
          '모델 호출 경량화·조회 병렬화·스키마 사전 적재, 검증된 질문·SQL 사례 재활용',
          '응답 77.1s → 29.0s, 첫 글자 6.8s → 2.5s (내부 테스트 기준)',
        ],
      },
      {
        title: '4. 다음 단계',
        points: ['웹 검색 확장 대비 할루시네이션 통제 설계 중 — 사실과 추론을 분리한 답변 구조'],
      },
    ],
  },
  ax_workflow: {
    description:
      '원정대 AI/AX 혁신팀 · 개발 프로세스 AX — PRD만 쓰면 AI가 와이어프레임을 생성하고, AI 두 개가 요구사항 빈틈을 교차 확인하는 Claude Code 플러그인 (Wireframe Dashboard · ax_workflow)',
    highlights: [
      'PRD → 화면 와이어프레임 자동 생성 — 디자이너 없이 화면 확정',
      '요구사항이 승인된 경우에만 생성·변경 허용, 변경 이력·부분 재생성으로 개발 인계 흐름 고정',
      'AI 두 개가 요구사항 빈틈을 교차 확인 — 구현 전 확인할 질문 46개 도출',
      '근거 없는 결정 자동 표시 검수 단계 + Claude Code 플러그인으로 팀 배포',
    ],
    details: [
      {
        title: '프로젝트 개요',
        points: [
          '기간: 2026.08 — 진행중',
          '역할: 단독 설계·개발·팀 배포',
          '기술: Claude Code (서브에이전트·스킬·플러그인)',
          '구성: Wireframe Dashboard · ax_workflow',
        ],
      },
      {
        title: '1. PRD → 와이어프레임',
        points: [
          '요청자가 요구사항 문서(PRD)만 쓰면 AI가 화면 와이어프레임을 생성 — 디자이너 없이 화면 확정',
          '요구사항이 승인된 경우에만 생성·변경을 허용',
          '변경 이력·부분 재생성으로 개발 인계 흐름 고정',
        ],
      },
      {
        title: '2. 요구사항 교차 검증',
        points: [
          'AI 두 개가 요구사항의 빈틈을 각각 찾아 교차 확인',
          '구현 전에 확인할 질문 46개 도출',
          '근거 없는 결정을 자동으로 표시하는 검수 단계 포함',
        ],
      },
      {
        title: '3. 팀 배포',
        points: ['Claude Code 플러그인으로 포장해 팀에 배포'],
      },
    ],
  },
  vogopang_front: {
    description:
      '두비덥 플랫폼 개발팀 · 보고팡 — 오디오 청크 로딩·Web Vitals 대시보드로 모바일 성능 개선 (Slow 4G Performance 96점, FCP 2239ms)',
    highlights: [
      'AI 개발 워크플로우(harness_build) 적용',
      '「모바일 느려요」→ Lighthouse 수치화·스펙 확정 후 개선 착수',
      '오디오 청크 로딩(첫 구간 선로드·다음 구간 프리패치) — Slow 4G Performance 96점(FCP 2239ms)',
      'Web Vitals 로깅·대시보드 — 페이지·도메인별 성능 상시 모니터링, PM·디자이너와 수치 기준 합의',
    ],
    details: [
      {
        title: 'AI 개발 워크플로우(harness_build) 적용',
        points: [
          '「모바일 느려요」→ Lighthouse 수치화·스펙 확정 후 개선 착수',
          '테스트 선행 — 청크 로딩·URL 정규화 정의, Slow 4G Performance 96점(FCP 2239ms)',
          '베이스라인 Notion 공유 — PM/디자이너 수치 기준 합의, 튜닝·회의 시간 절감',
          'Web Vitals 로깅·대시보드 — 측정→개선→회고 사이클 정착',
        ],
      },
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
    description:
      '두비덥 플랫폼 개발팀 · 푸딩툰 — 콘텐츠 도메인 UI·React Query 10개 영역 도입·번들 최적화 (모바일 LCP 21.9s→6.8s)',
    highlights: [
      'AI 개발 워크플로우(harness_build) 적용',
      'fetch 패턴 전수 조사 → React Query 10개 영역 도입, 공통 신고 훅·컴포넌트 패턴화',
      'Dynamic import·서버 컴포넌트로 번들 분리',
      '모바일 LCP 21.9s→6.8s, TBT 9.1s→550ms, CLS 0.972→0.196',
    ],
    details: [
      {
        title: 'AI 개발 워크플로우(harness_build) 적용',
        points: [
          'fetch 패턴 inventory → React Query 도입(10영역) 스펙·테스트 선행 후 refactor 주도',
          '공통 신고 훅·컴포넌트 패턴화 — 유사 화면 개발 리드타임 단축',
          '스펙 정리 후 번들 최적화 — Dynamic import·서버 컴포넌트 (모바일 LCP 21.9s→6.8s, TBT 9.1s→550ms, CLS 0.972→0.196)',
          'fetch·에러·반응형 컨벤션을 코드베이스 공통 패턴으로 축적·재사용',
        ],
      },
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
  obsidian_chat_bot: {
    description:
      'Obsidian vault + Notion/PDF를 Qdrant·BGE-M3 hybrid RAG로 검색하고, Hermes Agent MCP 멀티스텝·증분 인덱싱·OCR Docker·Obsidian 플러그인까지 포함한 사내 지식 검색 챗봇 설계·구현',
    highlights: [
      'Obsidian vault(notion/**/*.md) hybrid 검색 + rerank + LLM 채팅 — Next.js 16 기반 사내 지식 검색',
      'Qdrant(Docker) HNSW cosine 검색 — vectors.json에서 검색 엔진 분리로 확장성·속도 개선',
      'Hermes Agent MCP 멀티스텝 RAG — obsidian_rag_search · read_vault_note 도구로 1질문 N스텝 검색',
      '3채널 접근(웹 UI / Hermes Dashboard / Obsidian 플러그인) — 동일 company-rag 인덱스 공유',
    ],
    details: [
      {
        title: '1. 회사 문서 RAG 시스템 설계·구축',
        points: [
          'Obsidian vault(notion/**/*.md)를 인덱싱해 hybrid 검색 + rerank + LLM 채팅으로 질의응답',
          'Next.js 16 기반 웹 UI + /api/search · /api/chat API',
          '런타임에는 vault md를 다시 읽지 않고 Qdrant(또는 offline JSON)에서 청크 조회',
        ],
      },
      {
        title: '2. Qdrant 벡터 DB 도입',
        points: [
          '로컬 Docker Qdrant(company-rag 컬렉션)로 청크·임베딩 저장',
          'HNSW cosine 검색으로 top-K recall',
          'vectors.json 파일 방식에서 검색 엔진 분리 — 확장성·검색 속도 개선',
        ],
      },
      {
        title: '3. 임베딩 모델 업그레이드 (MiniLM → BGE-M3)',
        points: [
          'Xenova/bge-m3(1024차, multilingual) 임베딩 적용',
          'bge-reranker-v2-m3 cross-encoder 2단 retrieval 파이프라인',
          '1차 Hybrid Recall(키워드 + 시맨틱) → 2차 Rerank로 한국어 회의록·문서 검색 품질 개선',
        ],
      },
      {
        title: '4. PDF·이미지 문서 RAG 파이프라인',
        points: [
          'OpenDataLoader + hybrid OCR Docker(odp-hybrid)로 스캔 PDF/이미지 → sidecar md 변환',
          '기존 텍스트 RAG와 동일 검색 경로로 통합',
          'Obsidian PDF++ pageNumber 연동',
        ],
      },
      {
        title: '5. 증분 인덱싱 구현',
        points: [
          'index-manifest.json(mtime/size/qdrantPaths) 기반 diff로 변경 파일만 임베딩·Qdrant patch',
          '전체 재인덱싱 8분+ → 변경 1건 ~3초 수준으로 단축',
        ],
      },
      {
        title: '6. Notion → Obsidian export + 링크 그래프',
        points: [
          'Notion API bulk export로 vault 동기화',
          'notion_link / wikilink 기반 graph.json 구축',
          '검색 시 1-hop 이웃 노트 context 확장',
        ],
      },
      {
        title: '7. Obsidian Company RAG 플러그인',
        points: [
          '사이드바 Lookup UI, /api/search 연동',
          'API 장애 시 .company-rag/ offline fallback(키워드 + 그래프 확장)',
        ],
      },
      {
        title: '8. 인프라·DX',
        points: [
          'docker-compose(Qdrant + OCR hybrid) 로컬 개발 환경 구성',
          'Java 자동 탐지(IDE 터미널 PATH 이슈 대응)',
          'CLI(index, pdf:export, sync-index, --full) · .env 기반 설정',
        ],
      },
      {
        title: '9. 아키텍처 문서화',
        points: [
          'README에 유저 검색 → Qdrant → LLM / CLI 인덱싱 / vectors·graph JSON 역할을 mermaid·표로 정리',
          '팀 온보딩·운영 가이드 작성',
        ],
      },
      {
        title: '10. 실전 검증·한계 분석',
        points: [
          'test_pdf 논문·앱리뷰·엑셀 강의표 등 문서 타입별 OCR 품질 비교',
          'RAG 질문 표현에 따른 retrieval 실패 원인 분석(인덱싱 vs 검색 단계 분리)',
        ],
      },
      {
        title: '11. Hermes Agent MCP 연동 (멀티스텝 RAG)',
        points: [
          'Hermes Agent를 에이전트 레이어로 붙여, 기존 Qdrant RAG를 MCP 도구로 노출',
          'obsidian_rag_search — hybrid + rerank 검색을 여러 번 호출 가능 (1질문 N스텝)',
          'read_vault_note — 검색 스니펫이 아닌 vault md 전문 읽기 후 요약',
          'stdio MCP 서버(scripts/mcp-server.ts) + @modelcontextprotocol/sdk 구현',
        ],
      },
      {
        title: '12. 에이전트 vs 1회 RAG 아키텍처 분리',
        points: [
          '웹 UI(/api/chat): 검색 1회 → LLM 답변 1회 (Cursor SDK)',
          'Hermes: 도구 호출 루프 → 검색·읽기·재검색 → 최종 답변 (Nous LLM)',
          '동일 Qdrant 인덱스 공유 — RAG 엔진과 에이전트 역할 분리',
          'Next.js = 검색 본체, Hermes = 오케스트레이션',
        ],
      },
      {
        title: '13. Hermes 설정·운영 자동화',
        points: [
          'npm run hermes:setup — ~/.hermes/config.yaml에 MCP + toolsets 병합',
          'hermes/config.fragment.yaml 템플릿 + .env.local 값 자동 치환',
          'npm run hermes:chat / hermes:dashboard — PATH 보정 포함 npm 스크립트',
          'hermes/AGENTS.md — vault 우선·멀티스텝·web/terminal 사용 규칙',
        ],
      },
      {
        title: '14. Nous Portal OAuth + hosted tools',
        points: [
          'Quick Setup OAuth로 LLM API 키 없이 Hermes 연동',
          'Free tier + step-3.7-flash:free 모델 사용',
          'web_search / web_extract — Firecrawl gateway (vault 밖 정보 보완)',
          'terminal — 로컬 read-only 운영 점검 (Qdrant 상태 등)',
        ],
      },
      {
        title: '15. Hermes Web Dashboard 연동',
        points: [
          'hermes dashboard → 127.0.0.1:9119 브라우저 UI',
          '채팅·세션·MCP·모델 설정을 CLI 없이 관리',
          'Dashboard 채팅에서 mcp-obsidian_rag 도구 호출로 웹에서 멀티스텝 RAG 사용',
          'Gateway(Telegram/Slack)는 미연동 — CLI/Dashboard 전용',
        ],
      },
      {
        title: '16. 3채널 RAG 접근 경로',
        points: [
          'Next.js 웹 UI — Cursor SDK, 1회 hybrid+rerank',
          'Hermes Dashboard — Nous Portal, MCP 멀티스텝',
          'Obsidian 플러그인 — LLM 없음, /api/search only',
          '한 인덱스(company-rag)로 웹·에이전트·Obsidian 동시 서비스',
        ],
      },
      {
        title: '17. 비용·성능 트레이드오프 분석',
        points: [
          '로컬 RAG 검색(MCP) — Nous 과금 없음 (CPU bge-m3 + rerank)',
          'LLM·web_search — Nous Portal 크레딧 pay-as-you-go',
          '멀티스텝 = 검색 품질↑, latency↑ (cold start 60~90초 + 턴당 LLM)',
          'Cursor(웹) vs Nous(Hermes) 과금 경로 분리 문서화',
        ],
      },
    ],
  },
  harness_build: {
    description:
      '두비덥 플랫폼 개발팀 · 개발팀에 직접 도입한 Claude Code 기반 AI 개발 하네스 — 요구 분석부터 패턴 축적까지 (유사 기능 개발 기간 약 30% 단축)',
    highlights: [
      '요구 분석 → 스펙 → 테스트 선행 → 구현 → QA → 패턴 축적 파이프라인을 팀에 도입',
      '모호한 요청은 AI가 질문·스펙 초안을 먼저 만들어 구현 전에 PM·기획과 합의',
      'fetch·훅·네이밍 컨벤션을 git 공통 자산으로 축적해 푸딩툰·DubRight·보고팡에 적용',
      '유사 기능 개발 기간 약 30% 단축',
    ],
    details: [
      {
        title: '팀 도입과 성과',
        points: [
          '기간: 2026.06 — 2026.08',
          '기술: Python · Claude Code · Cursor',
          '문제: 모호한 요구가 구현 단계에서야 구체화되고, 서비스마다 fetch·훅·네이밍이 달라 비슷한 기능을 매번 새로 개발',
          'Claude Code·Cursor로 요구 분석 → 스펙 → 테스트 선행 → 구현 → QA → 패턴 축적 파이프라인을 팀에 도입',
          '모호한 요청은 AI가 질문·스펙 초안을 먼저 만들게 해 PM·기획과 합의 후 구현',
          '팀의 fetch·훅·네이밍 컨벤션을 git 공통 자산으로 쌓아 푸딩툰·DubRight·보고팡에 적용 — 유사 기능 개발 기간 약 30% 단축',
        ],
      },
      {
        title: '1. 자연어 → TDD 파이프라인 설계 및 구현',
        points: [
          '기획 확인(Phase 1) → 테스트 선행 생성(Phase 1.5) → 레이어 구현(Phase 2) → 테스트 실행 검증(Phase 3) → 패턴 학습(Phase 4.5) 전 파이프라인 자동화',
          'dev 스킬 오케스트레이터가 각 Phase별 서브 에이전트(code-analyzer, test-writer, implementer, qa-validator, pattern-extractor)를 순차 디스패치',
          'Phase 3 FAIL 시 implementer 자동 재호출 최대 2회 — QA 통과 확인 후에만 커밋 단계 진입',
          '커밋 여부는 항상 사용자 확인 후 실행 — 완전 자동 커밋 없음',
          'harness.config.yaml의 stack: auto 설정 시 package.json / go.mod / pubspec.yaml 등 프로젝트 파일 기반 스택 자동 감지',
          'install.sh — 신규 프로젝트 초기 설치 / 기존 프로젝트 병합 두 경로 분기 처리',
        ],
      },
      {
        title: '2. 서브 에이전트 역할 분리',
        points: [
          'test-writer — jest / vitest / flutter_test / pytest 등 스택별 테스트 파일 선행 생성 (TDD Red 단계)',
          'implementer — 스택별 레이어 순서(types → services → hooks → components → app 등)로 구현, 테스트 assertion을 구현 기준으로 사용 (TDD Green)',
          'qa-validator — 실제 테스트 실행 + 스펙 달성 검증 + 정적 분석 (FAIL 시 implementer 재호출 신호 발생)',
          'pattern-extractor — 커밋 후 실행, candidates.md SUGGEST 항목에 대한 사용자 승인/거부 인터랙션 포함',
        ],
      },
      {
        title: '3. 기획 레벨 자동 추론 (Phase 0)',
        points: [
          '기존 low: / mid: / high: 키워드 없이 요청 텍스트만으로 기획 복잡도를 자동 추론하는 Phase 0 로직 추가',
          '명확한 키워드(버튼 추가, 색상 변경 등)는 즉시 low로 결정, 애매한 표현(연동, 리팩터링 등)은 사용자에게 질문',
          'code-analyzer가 코드베이스 스캔 후 INFERRED_LEVEL을 01_spec.md에 포함, 오케스트레이터가 Phase 0 추론값과 비교해 레벨 보정',
          '범용 code-analyzer와 Next.js 특화 code-analyzer 양쪽에 INFERRED_LEVEL 출력 스펙 적용',
        ],
      },
      {
        title: '4. 팀 패턴 학습 시스템',
        points: [
          '커밋 승인된 구현 코드에서 hooks / services / types / components / naming 레이어별 반복 결정을 추출해 .harness/patterns/*.yaml에 자동 적재',
          '신뢰도(user_approved / qa_pass / repeated) × 영향도(텍스트 규칙 vs 코드 생성) 매트릭스로 AUTO / SUGGEST / FLAG / MANUAL 4단계 분류',
          'repeated만으로는 AUTO 등록 불가 — 나쁜 습관 반복이 팀 패턴으로 굳는 것을 방지',
        ],
      },
    ],
  },
  dubright_front: {
    description:
      '두비덥 플랫폼 개발팀 · DubRight — 더빙 검수 플랫폼, 수백 개 트랙 지연 로드·구간 마커 DnD·씬 저장/복원 (Vue 3)',
    highlights: [
      'AI 개발 워크플로우(harness_build) 적용',
      '모호 요구(검수 속도·구간 저장) → 스펙·질문 리스트 정리 후 착수',
      '스펙·테스트 선행 — 구간 마커 DnD·권한별 UI, Intersection Observer 검수 최적화',
      'parallelLoad·권한 분리 패턴 자산화 — 핵심 버그 5건 수정',
    ],
    details: [
      {
        title: 'AI 개발 워크플로우(harness_build) 적용',
        points: [
          '모호 요구(검수 속도·구간 저장) → 스펙·질문 리스트 정리 후 착수',
          '스펙·테스트 선행 — 구간 마커 겹침·권한별 UI 고정 후 DnD·씬 저장·복원',
          '코드 분석으로 수백 트랙 병목 특정 → Intersection Observer 적용, 검수 효율 개선',
          'parallelLoad·권한 분리 패턴 자산화 — 핵심 버그 5건 수정',
        ],
      },
      {
        title: '1. 마이보이스 — 구간 마커 시스템 (Drag & Drop)',
        points: [
          '오디오 타임라인 위에 드래그로 구간(시작점~끝점)을 직접 지정하는 UI 구현',
          '마커 드래그 시 구간 내 대사 배분 실시간 재계산',
          '구간 겹침 즉시 감지 → [적용] 버튼 비활성화로 잘못된 저장 방지 (Vue computed 활용)',
          '에러 발생 시 이전 top 값으로 자동 롤백하여 UI 상태 유지',
          '드래그 이벤트 좌표 → 퍼센트 비율 변환으로 반응형 레이아웃 대응',
          '대사 지속시간 = spoint 시작·끝 값 기준 ms 단위 파싱으로 계산',
        ],
      },
      {
        title: '2. 마이보이스 — 씬(Scene) 저장·복원 시스템',
        points: [
          'GET /my-voice/scenes/:episodeNo → scenes[] + characters[] 동시 수신 구조 설계',
          '씬 복원 시 구간 마커 위치, 크롭 이미지, mpoint 전체 복원',
          '구간 겹침 에러 발생 시에도 기존 저장된 씬 카드 유지 (UX 안정성)',
          '첫 장면 추가 시 에피소드 제목 자동 전송, 마지막 대사 삭제 시 값 초기화',
        ],
      },
      {
        title: '3. 마이보이스 — 주요 캐릭터 패널 v2',
        points: [
          '에피소드 캐릭터 목록 표시 + 현재 구간 내 각 캐릭터 대사 수(N) 계산',
          '체크 + 썸네일 업로드 완료 시에만 [저장] 버튼 활성화',
          '비활성 캐릭터는 hole.url = "" → ShockWave fetch 스킵으로 DOM 절약',
          '아티스트 승인 API도 활성 캐릭터(cu)만 필터링해 호출',
        ],
      },
      {
        title: '4. 오디오/이미지 병렬 로딩',
        points: [
          '순차 로딩으로 다수 파일 처리 시 발생하는 병목 문제 해결',
          '커스텀 유틸 함수(parallelLoad)로 5개씩 청크 단위 Promise.all 병렬 처리 구현',
        ],
      },
      {
        title: '5. 검수 페이지 Intersection Observer 적용',
        points: [
          '수백 개 트랙이 한 번에 렌더링되어 발생하는 메모리·렌더링 과부하 문제 해결',
          'IntersectionObserver로 뷰포트에 진입한 트랙만 오디오 로드',
          '스크롤 외 구간은 RecordHole 비마운트 유지로 메모리 절약',
        ],
      },
      {
        title: '6. XY 좌표 시스템 API 연동',
        points: [
          '영상 내 자막/요소 위치 지정 기능 구현',
          '좌표 생성·조회·삭제 API 연동',
          'Y축 지정 시 전체 길이(duration) 기반 퍼센트 비율 계산',
          'DND로 위치 변경 → 백엔드 실시간 전달',
        ],
      },
      {
        title: '7. 검수 권한 분리',
        points: [
          '작품 검수자: 연출 편집 불가 → 관련 UI 전체 제거',
          '작품 연출자: 연출 편집 권한 유지 (화면 연출관리에서도 audio_track 데이터 조작 가능)',
          '검수 완료 상태에서는 페이지 진입 자체를 제한',
          '진입 확인창 중복 표시 버그 수정',
        ],
      },
      {
        title: '8. 핵심 버그 수정',
        points: [
          '더빙 파일 교체 롤백 — API 완료 후에만 파일 삭제, 실패 시 기존 파일 유지',
          '조용한 환경 음성 자동 수정 — Web Audio API echo/noise 설정 비활성화로 녹음 품질 개선',
          '일괄 gain 적용 — 이전 값 상속 후 diff만 적용하여 덮어쓰기 문제 해결',
          '연출 검수 다이얼로그 이벤트 중복 — 이벤트 리스너 정리 로직 추가',
          '메모리 삭제 후 음성 무음 — tone 생성 노드는 메모리 삭제 후에도 유지되도록 수정',
        ],
      },
    ],
  },
  horror_game: {
    description:
      'Unity WebGL 1인칭 공포 게임 — 8개 런타임 생성 맵·차원 포털 로그라이크 루프·WebGL 전용 에셋 레지스트리·GitHub Actions 자동 배포까지 1인 end-to-end 구현',
    highlights: [
      'Android 2.5D MVP에서 WebGL 1인칭 공포로 피벗 — 포털 기반 아케이드형 런 구조',
      '11 씬 · 8개 procedural map · 6+ entity type · ~675MB WebGL build',
      'HorrorAssetRegistry + URP 머티리얼 베이크로 에디터/WebGL 이중 로드 계층 분리',
      'GitHub Actions(Unity 6) → WebGL 빌드 → Netlify 프로덕션 자동 배포',
    ],
    details: [
      {
        title: '1. 게임 루프 & 차원 포털 시스템',
        points: [
          'Android 2.5D MVP(열쇠·자물쇠 탈출)에서 브라우저 WebGL 1인칭 공포로 피벗 — 포털만으로 진행하는 아케이드형 런 구조',
          'Map_00 프롤로그(도시 낙하) → 8개 랜덤 차원 맵(Map_01~08) → 귀환 맵 도달 시 Map_Reality 탈출 엔딩',
          'DimensionMapPool + GameManager로 현재 맵 제외 랜덤 선택, 귀환 맵(_returnMapScene) 추적, 사망 시 Map_00 리셋',
          'DimensionPortal — 플레이어 끌어당김 + FOV 확대 + 몬스터 일시정지 + 사운드 시퀀스 후 씬 전환',
          'DimensionWakeSequence — 차원 진입 시 누워 있다 일어나는 1인칭 연출, noclip 진입(NoclipEntryState) 지원',
          'DimensionPortalVisuals — 포털 링·코어·파티클·조명·험(hum) 오디오, 귀환/차원 포털 색상 팔레트 분기',
        ],
      },
      {
        title: '2. 런타임 맵 생성 (Bootstrap + MapBuilder)',
        points: [
          '씬마다 MapXXBootstrap → XXMapBuilder.Build() → 레이아웃·플레이어·포털·NavMesh·몬스터 스폰을 Awake 시점에 조립',
          'Map_01 Backrooms(BackroomsMapBuilder) · Map_02 지하 주차장(ParkingGarageMapBuilder) · Map_03 Sponza 미로(SponzaMazeMapBuilder) · Map_04 Prototype(PrototypeMapMapBuilder)',
          'Map_05 NYC 도시(NycCityMapBuilder) · Map_06 다층 인테리어(InteriorsAMapBuilder) · Map_07 Backrooms-like(BackroomsLikeMapBuilder) · Map_08 터널 추격전(TunnelMapBuilder)',
          'MazeGenerator + 시드 기반 벽 배치, NavMeshBaker / NavMeshWallCarver로 런타임 NavMesh 구성',
          '맵별 Atmosphere 클래스 — 안개·조명·사운드(예: TunnelAtmosphere 공습 사이렌 2D+3D)',
        ],
      },
      {
        title: '3. 몬스터 AI & 엔티티 비주얼',
        points: [
          'MonsterAI — Idle → Patrol → Chase → Search 상태 머신, NavMeshAgent 추적, 시야(MonsterVision) + Raycast 차단',
          '포털/기상/포획 시 PauseAllForWake / PauseAllForCatch로 전역 AI 일시정지',
          '맵별 전용 엔티티 + Map08 전 타입 동시 추격(Map08ChaseSpawner): Mutant, ZombieMale, Pumpkin, Priest, Insurgent, Smiler(텍스처 기반)',
          '*VisualSetup 클래스 — 에디터 AssetDatabase / WebGL HorrorAssetRegistry 이중 로드, URP 머티리얼·텍스처 런타임 적용',
          'MaterialURPFixer — HDRP/Built-in/Shader Graph 에셋을 URP Lit으로 변환, WebGL 핑크 머티리얼 방지',
        ],
      },
      {
        title: '4. WebGL 배포 파이프라인',
        points: [
          'HorrorAssetRegistry — Resources/ 중앙 ScriptableObject, AssetDatabase 없는 WebGL에서 프리팹·머티리얼·텍스처·애니메이터·오디오 일괄 로드',
          'HorrorAssetRegistryBuilder — 에디터 메뉴로 레지스트리 자동 생성, NYC/Tunnel URP 머티리얼 프리베이크 → BakedMaterialLookup',
          'WebGLBuild — itch.io(200MB 한도, 텍스처 half-res) / Netlify(풀 품질) 듀얼 빌드 프로파일',
          'WebGLPrefabLinker — 8개 맵 씬 Bootstrap ↔ 프리팹 자동 연결',
          'GitHub Actions(game-ci/unity-builder Unity 6) → WebGL 빌드 → Netlify 프로덕션 배포',
          'deploy-netlify.sh — draft 업로드 후 restoreSiteDeploy API로 프로덕션 승격 (CLI --prod Forbidden 우회)',
        ],
      },
      {
        title: '5. 플레이어 & UX',
        points: [
          '1인칭 FirstPersonCamera + 가상 조이스틱(WebGL 터치), SensitivitySettingsUI로 감도 저장',
          'PlayerHuntedAudio / PlayerBreathAudioSetup — 추격·호흡 SFX, HorrorScreenEffects·HorrorFilmGrain 공포 연출',
          'SceneTransitioner — 페이드 전환, 차원/현실/노클립 진입 모드 분기',
          'MainMenu → 새 런 시작, 목숨·맵 상태는 디스크 저장 없음(세션 아케이드)',
        ],
      },
      {
        title: '6. 개발 방식 (Claude Code + Superpowers)',
        points: [
          'superpowers 스킬(TDD, systematic-debugging, writing-plans) 기반 맵 → 엔티티 → 텍스처 반복 개발',
          '에디터/WebGL 동작 차이를 레지스트리·머티리얼 베이크·런타임 로더로 계층 분리해 해결',
          '미사용 서드파티 에셋 ~1.3GB GUID 교차참조 검증 후 제거 — 프로젝트/CI 임포트 부담 절감',
          'Tech Stack: Unity 6000.4.10f1 · URP · WebGL · NavMesh AI · GitHub Actions · Netlify',
          'Scale: 11 씬 · 8 procedurally assembled maps · 6+ entity types · ~675MB WebGL build',
          'Role: 기획·설계·Unity C# 구현·WebGL 파이프라인·CI/CD 전부 1인',
        ],
      },
    ],
  },
  'village-run': {
    description:
      'GPS 러닝 땅따먹기 앱 — Shoelace 영역 계산·Flutter 네이버맵 실시간 오버레이·Supabase PostGIS 누적 점령·공유 웹까지 1인 end-to-end 구현',
    highlights: [
      'Shoelace 공식(구면 근사) + 경로 법선 5m 버퍼 폴리곤으로 실제 점령 면적 산출',
      'flutter_naver_map 다크 네온 UI — 실시간 폴리곤·경로·bearing 카메라 추적',
      'Supabase PostGIS ST_Union 누적 영역 + Firebase Hosting Leaflet 공유 웹',
      'TDD 기반 TerritoryCalculator·TrackingService 유닛 테스트',
    ],
    details: [
      {
        title: '1. GPS 영역 계산 엔진 설계 및 구현',
        points: [
          '시작점 20m 이내 복귀 시 루프로 판정 → Shoelace 공식(구면 근사)으로 내부 폴리곤 면적 계산',
          '직선 경로는 경로 법선 방향으로 좌우 5m 버퍼 폴리곤 생성 → 실제 폴리곤 면적으로 점령 면적 산출 (직사각형 근사 아님)',
          '계산 결과를 GeoJSON Polygon으로 출력 → 앱 지도 오버레이·Supabase PostGIS·공유 웹 Leaflet에서 동일 포맷 재사용',
          'TerritoryCalculator / TrackingService 분리 — 영역 계산(순수 로직)과 GPS 스트림 수집(플랫폼 의존) 레이어 분리',
          'GPS 노이즈 필터링 — 3m 미만 이동은 포인트 추가 생략, Android는 Foreground Notification + WakeLock으로 백그라운드 추적 유지',
        ],
      },
      {
        title: '2. Flutter 모바일 앱 UI/UX 및 실시간 지도 연동',
        points: [
          'flutter_naver_map 기반 다크 네온 UI — 점령 폴리곤(네온 그린), 실시간 경로(점선 폴리라인), 현재 위치 마커 커스텀 위젯 오버레이',
          'MapController + ChangeNotifier 패턴 — 트래킹 상태·완료 영역·현재 위치·bearing을 단일 컨트롤러에서 관리, 지도 오버레이 동기화',
          '트래킹 중 bearing 기반 카메라 추적 — Geolocator.bearingBetween으로 진행 방향 회전, zoom 17 실시간 팔로우',
          '듀얼 런 모드 — 땅따먹기: 종료 시 Supabase 저장 + 면적 계산 / 드로잉: 저장 없이 경로만 유지, RepaintBoundary로 지도 PNG 캡처 후 share_plus 공유',
          '3-2-1 카운트다운 → 모드 선택 바텀시트 → 기록 중 실시간 거리·면적 칩 표시 → 기록 화면에서 일별 카드 + 전체/개별 공유 링크 생성',
        ],
      },
      {
        title: '3. Supabase + PostGIS 백엔드 및 공유 웹',
        points: [
          'DB 스키마 설계 — runs(경로 JSONB + geometry + territory_geojson), user_territory(누적 영역), auth.users 연동 트리거',
          'upsert_user_territory RPC — ST_GeomFromGeoJSON + ST_Union으로 회차 영역을 누적 병합, auth.uid() 검증으로 본인만 쓰기 허용',
          'RLS 정책 — 쓰기는 본인만, 읽기는 공개(select using true) → 공유 웹에서 anon key로 타인 기록 조회 가능',
          'Firebase Hosting 공유 웹 — Leaflet.js + OSM 타일, /share/{userId} / /share/{userId}/{runId} SPA rewrite',
          '사이드바에 일별 러닝 카드 + 총 점령 면적 표시, 카드 클릭 시 해당 폴리곤 하이라이트 + fitBounds — 모바일 반응형(지도 60vh / 사이드바 40vh)',
        ],
      },
      {
        title: '4. 인증·품질 보증·배포 준비',
        points: [
          'Google OAuth — google_sign_in + Supabase signInWithIdToken, Google 브랜딩 가이드라인 준수 SVG 로그인 버튼',
          'TDD 기반 핵심 로직 테스트 — TerritoryCalculator(루프/직선/엣지케이스 3건), TrackingService(최소 이동 거리·stop 초기화 3건) 유닛 테스트',
          'Superpowers 방법론 적용 — brainstorming → writing-plans → TDD → verification 파이프라인으로 설계·구현·검증 분리',
          '스토어 배포 스캐폴드 — Android 릴리스 서명(key.properties), .env.example, privacy.html 호스팅, deployment-prep.md 체크리스트 작성',
          '스플래시 애니메이션 — 바운스·발자국·속도선 커스텀 페인터, 세션 유무에 따라 로그인/지도 화면 자동 분기',
        ],
      },
    ],
  },
  'web-vital-cheking': {
    description:
      'web-vital-kit — "웹 바이탈 구축해줘" 한 마디로 Next/React/Vue/Nuxt에 Core Web Vitals 수집·대시보드·Lighthouse 파이프라인을 자동 구축하는 CLI 툴킷',
    highlights: [
      'AGENTS.md + Cursor Rule + Skill 3중 AI 가이드 → npx web-vital-kit init 자연어 트리거',
      'Next.js / React(Vite) / Vue(Vite) / Nuxt 프레임워크 자동 감지 + 템플릿 일괄 설치',
      '폴더 라우팅 = 도메인 — 1뎁스 폴더 추가 시 설정 변경 없이 자동 등록·도메인별 ndjson 로그',
      'Google web-vitals v5 공식 라이브러리 기반 — LCP·INP·CLS 필드 데이터 + Lighthouse 합성 측정 분리',
    ],
    details: [
      {
        title: '1. 자연어 → Web Vitals 자동 구축 파이프라인',
        points: [
          '"웹 바이탈 구축해줘" 한 마디로 Cursor / Claude가 설치 플로우 진입',
          'AGENTS.md + Cursor Rule (.cursor/rules/web-vital-kit.mdc) + Skill (skills/install-web-vitals/) 3중 AI 가이드 — 자연어 트리거 → npx web-vital-kit init 실행까지 연결',
          'CLI web-vital-kit init — 프레임워크 자동 감지 → 템플릿 복사 → package.json / .gitignore / 진입점 패치까지 일괄 처리',
          '--dry-run / --force / --cwd / --framework 옵션으로 신규·기존 프로젝트 모두 대응',
          '설치 후 사용자가 yarn dev로 직접 검증 — 완전 무인 배포 없음, 대시보드(/web-vital/dashboard)에서 수집 확인',
        ],
      },
      {
        title: '2. 프레임워크별 서브 모듈 분리',
        points: [
          'detect-framework.mjs — package.json·설정 파일 기반으로 Next / React / Vue / Nuxt 자동 감지',
          'nextjs-app-router 템플릿 — Route Handler API + app-routes.ts 스캐너 + layout.tsx WebVitalsInitializer 패치',
          'react-vite / vue-vite 템플릿 — Vite plugin API 미들웨어 + src/pages/ 스캐너 + main.tsx 패치',
          'nuxt 템플릿 — Nitro server/routes/web-vital/api + pages/ 스캐너 + client plugin',
          'route-scanner-pages.mjs — React/Vue/Nuxt 공통 pages/ 폴더 라우팅 → URL·도메인 변환',
          'vite-plugin-web-vital.mjs — Vite dev server에 /web-vital/api 인라인 주입 (별도 프로세스 불필요)',
          'Lighthouse 스크립트 — Slow 4G / Fast 4G / No throttling 3종 네트워크 프로필 합성 측정',
        ],
      },
      {
        title: '3. 도메인 자동 추적 (핵심 차별점)',
        points: [
          '폴더 라우팅 = 도메인 — app/series/, pages/alarm/, pages/my-voice/ 등 1뎁스 폴더 추가 시 설정 변경 없이 자동 등록',
          'GET /web-vital/api/domains — 매 요청마다 파일시스템 재스캔, 신규 도메인 즉시 반영',
          '동적 라우트 지원 — /series/[id], /series/[...slug] 등 패턴 매칭 후 도메인 /series로 그룹핑',
          'dev 로그 도메인별 분리 — src/web-vital-logs/series/, my-voice/ 등 폴더 단위 ndjson 저장',
          '대시보드 도메인 필터 — 도메인 → 페이지 → 기기 3단 필터 + 자동 스캔 뱃지 UI',
        ],
      },
      {
        title: '4. Google 공식 지표 기반 측정 신뢰도',
        points: [
          '수집 라이브러리: Google web-vitals v5 (Chrome 팀 공식) — 자체 산식 없음',
          'Core Web Vitals: LCP · INP · CLS — Google Search Central 임계값 그대로 rating 산출',
          '참고 지표: TTFB — 동일 라이브러리로 수집, 서버·네트워크 튜닝용',
          '등급: good / needs-improvement / poor — Google 기준값 미변형',
          'Lighthouse CLI — FCP · LCP · TBT · Speed Index 등 합성 지표 (Chrome 공식)',
          '필드 데이터(실사용자)와 합성 데이터(Lighthouse) 역할 분리 — 대시보드/API/dev 로그는 필드 데이터 단일 원천',
        ],
      },
      {
        title: '5. 설치 산출물 구조 (프레임워크별)',
        points: [
          '공통 라우트 prefix: /web-vital (dashboard · api · api/domains · api/routes)',
          'docs/vitals/ — Core Web Vitals 베이스라인 문서',
          'scripts/ — Lighthouse 네트워크 프로필 측정',
          '.cursor/rules/web-vital-kit.mdc — Cursor 자연어 트리거',
          'Next.js → src/app/web-vital/ + layout.tsx 패치',
          'React/Vue → src/web-vital/ + web-vital-kit/ Vite plugin + vite.config 패치',
          'Nuxt → pages/web-vital/ + server/routes/web-vital/api/ + plugins/web-vitals.client.ts',
          '기술 스택: Claude Code · Cursor · Node.js ESM · TypeScript · Google web-vitals · Lighthouse CLI',
          '지원 스택: Next.js · React (Vite) · Vue (Vite) · Nuxt — 프레임워크 자동 감지 + --framework 수동 지정',
        ],
      },
    ],
  },
}

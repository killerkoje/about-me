export type CaseStudy = {
  id: string
  title: string
  subtitle: string
  category: string
  cover: string
  tools: string[]
  role: string
  timeline: string
  team: string

  // Hero
  tagline: string

  // Overview
  background: string

  // Problem
  problem: string
  problemDetail: string
  painPoints: { label: string; stat: string }[]

  // Research
  researchMethods: string[]
  researchInsights: { quote: string; from: string }[]
  researchImages: string[]

  // Process
  processSteps: { step: string; desc: string; image: string }[]

  // Final
  finalImages: string[]
  finalDesc: string

  // Result
  result: string
  resultSub: string
  metrics: { label: string; value: string; change: string }[]

  // Learnings
  learnings: string[]
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: '1',
    title: '금융 앱 리디자인',
    subtitle: 'TOSS BANK · 2024',
    category: 'UX/UI',
    cover: 'https://picsum.photos/seed/finance/1200/700',
    tools: ['Figma', 'Maze', 'FigJam', 'Hotjar'],
    role: 'Lead UX Designer',
    timeline: '2024.03 – 2024.07 (5개월)',
    team: 'PM 1, 디자이너 2, 개발자 4',
    tagline: '복잡한 송금 경험을\n단 2번의 탭으로',
    background: '토스뱅크의 이체 기능은 출시 이후 꾸준히 민원이 쌓였습니다. 고객 이탈률 38%, 앱스토어 평점 3.2점. 숫자가 문제를 명확히 말하고 있었습니다.',
    problem: '왜 사람들은 송금 도중 앱을 끄는가?',
    problemDetail: '기존 플로우는 5단계였습니다. 계좌 입력 → 금액 입력 → 수취인 확인 → 비밀번호 → 완료. 각 단계마다 다른 UI 패턴, 일관성 없는 버튼 위치, 그리고 중간에 끼어드는 광고 배너.',
    painPoints: [
      { label: '이탈률', stat: '38%' },
      { label: '평균 소요 시간', stat: '47초' },
      { label: '민원 중 UX 관련', stat: '61%' },
    ],
    researchMethods: ['심층 인터뷰 (20명)', '설문조사 (500명)', 'Hotjar 히트맵 분석', '경쟁앱 벤치마킹 (카카오페이, 네이버페이)'],
    researchInsights: [
      { quote: '"계좌번호 입력하고 나면 다음에 뭘 눌러야 할지 모르겠어요. 버튼이 어디 있는지..."', from: '인터뷰 참여자 A, 32세 직장인' },
      { quote: '"송금하다가 광고 나오면 너무 불쾌해서 그냥 창 닫아버려요."', from: '인터뷰 참여자 B, 28세 프리랜서' },
      { quote: '"카카오페이는 3번이면 되던데 왜 이건 이렇게 많이 눌러야 해요?"', from: '인터뷰 참여자 C, 45세 자영업자' },
    ],
    researchImages: [
      'https://picsum.photos/seed/research1/800/500',
      'https://picsum.photos/seed/research2/800/500',
    ],
    processSteps: [
      {
        step: '01  현황 분석',
        desc: '기존 5단계 플로우를 태스크 플로우로 시각화하고, 각 단계별 이탈 지점을 히트맵으로 특정했습니다. 3번째 단계에서 이탈의 42%가 발생하는 것을 확인.',
        image: 'https://picsum.photos/seed/process1/800/480',
      },
      {
        step: '02  와이어프레임',
        desc: '5단계를 2단계로 통합하는 아이디어를 Lo-Fi 와이어프레임으로 빠르게 검증했습니다. 계좌+금액을 한 화면에, 확인+인증을 한 화면에.',
        image: 'https://picsum.photos/seed/process2/800/480',
      },
      {
        step: '03  프로토타입 테스트',
        desc: 'Maze로 20명에게 프로토타입을 테스트했습니다. 1차 테스트에서 버튼 CTA 문구 문제 발견 → 즉시 수정 후 2차 테스트에서 태스크 완료율 94%.',
        image: 'https://picsum.photos/seed/process3/800/480',
      },
    ],
    finalImages: [
      'https://picsum.photos/seed/final1a/600/900',
      'https://picsum.photos/seed/final1b/600/900',
      'https://picsum.photos/seed/final1c/600/900',
    ],
    finalDesc: '최종 디자인은 5단계 플로우를 2단계로 압축했습니다. 자주 쓰는 계좌를 상단에 노출하고, 인증은 생체인식으로 대체. 광고 배너를 완전히 제거하고 핵심 액션에만 집중.',
    result: '이탈률 38% → 12%',
    resultSub: '출시 2개월 후 기준',
    metrics: [
      { label: '이탈률', value: '12%', change: '↓26%p' },
      { label: '평균 소요 시간', value: '18초', change: '↓62%' },
      { label: '앱스토어 평점', value: '4.6점', change: '↑1.4점' },
    ],
    learnings: [
      '사용자 인터뷰에서 나온 불만은 항상 더 깊은 구조적 문제의 신호였습니다.',
      '광고 수익보다 경험 개선이 장기적으로 더 큰 가치를 만든다는 걸 데이터로 증명했습니다.',
      '프로토타입 테스트는 빠를수록 좋다. 1차 테스트의 실패가 2차를 성공시켰습니다.',
    ],
  },
  {
    id: '2',
    title: 'B2B SaaS 대시보드',
    subtitle: 'KAKAO CORP · 2024',
    category: 'Product Design',
    cover: 'https://picsum.photos/seed/saas2/1200/700',
    tools: ['Figma', 'Notion', 'Zeplin', 'Mixpanel'],
    role: 'Product Designer',
    timeline: '2024.01 – 2024.05 (5개월)',
    team: 'PM 2, 디자이너 1, 개발자 6, 데이터 엔지니어 2',
    tagline: '10개의 엑셀을\n하나의 화면으로',
    background: '카카오 내부 운영팀은 매일 10개의 엑셀 파일을 열어 데이터를 수동으로 합산하고 있었습니다. 이 작업에만 하루 평균 3시간이 소요되었고, 실수도 잦았습니다.',
    problem: '왜 전문가들이 엑셀에 갇혀 있는가?',
    problemDetail: '기존 내부 툴은 개발자가 빠르게 만든 관리자 페이지였습니다. 필터도 없고, 데이터 시각화도 없고, 엑스포트 기능도 없었습니다. 운영팀은 이를 보완하기 위해 엑셀로 마이그레이션하는 루틴을 만들었고, 그게 수년간 이어졌습니다.',
    painPoints: [
      { label: '일일 수동 작업', stat: '3시간' },
      { label: '월간 데이터 오류 발생', stat: '12건' },
      { label: '온보딩 소요 기간', stat: '2주' },
    ],
    researchMethods: ['현업 워크숍 (운영팀 8명)', '컨텍스추얼 인콰이어리', '기존 툴 사용성 감사', '경쟁 SaaS 벤치마킹'],
    researchInsights: [
      { quote: '"이 버튼이 뭔지 몰라서 항상 옆 동료한테 물어봐요. 문서도 없고."', from: '운영팀 팀장, 신입 온보딩 담당' },
      { quote: '"데이터 뽑으려면 개발팀한테 슬랙 보내고 하루 기다려야 해요."', from: '운영팀 매니저 B' },
      { quote: '"숫자가 맞는지 확인하려면 세 개 탭을 왔다 갔다 해야 해서 실수가 나요."', from: '운영팀 시니어 C' },
    ],
    researchImages: [
      'https://picsum.photos/seed/saasresearch1/800/500',
      'https://picsum.photos/seed/saasresearch2/800/500',
    ],
    processSteps: [
      {
        step: '01  정보 구조 재설계',
        desc: '운영팀이 실제로 매일 보는 숫자 Top 10을 인터뷰로 추출했습니다. 그것만 대시보드 상단에 배치하고, 나머지는 드릴다운 구조로 숨겼습니다.',
        image: 'https://picsum.photos/seed/saasprocess1/800/480',
      },
      {
        step: '02  컴포넌트 시스템',
        desc: '개발 속도를 위해 Figma에서 12개의 핵심 컴포넌트만 정의했습니다. 필터, 테이블, 차트, 카드. 이 조합으로 모든 화면을 구성할 수 있도록.',
        image: 'https://picsum.photos/seed/saasprocess2/800/480',
      },
      {
        step: '03  실사용 테스트',
        desc: '개발 중인 프로토타입을 실제 운영팀에 2주간 병행 사용시켰습니다. 기존 엑셀 루틴과 비교해 어디서 막히는지 관찰.',
        image: 'https://picsum.photos/seed/saasprocess3/800/480',
      },
    ],
    finalImages: [
      'https://picsum.photos/seed/saasfinal1/900/600',
      'https://picsum.photos/seed/saasfinal2/900/600',
      'https://picsum.photos/seed/saasfinal3/900/600',
    ],
    finalDesc: '핵심 KPI를 대시보드 상단에 카드로 배치하고, 필터·정렬·CSV 엑스포트를 한 화면에서 처리할 수 있도록 했습니다. 엑셀 없이도 운영이 가능한 구조.',
    result: '업무 처리 시간 40% 단축',
    resultSub: '도입 1개월 후 기준',
    metrics: [
      { label: '일일 수동 작업', value: '1.8시간', change: '↓40%' },
      { label: '데이터 오류', value: '1건/월', change: '↓92%' },
      { label: '온보딩 기간', value: '3일', change: '↓78%' },
    ],
    learnings: [
      'B2B 툴은 기능보다 정보 구조가 먼저입니다. 잘못된 IA 위에 좋은 UI는 없습니다.',
      '실사용 병행 테스트는 릴리즈 전 마지막 안전망이었습니다.',
      '컴포넌트를 적게 만들수록 개발 속도와 일관성이 동시에 올라갔습니다.',
    ],
  },
  {
    id: '3',
    title: '헬스케어 앱 0→1',
    subtitle: 'NAVER CLOVA · 2023',
    category: 'Research + UI',
    cover: 'https://picsum.photos/seed/health3/1200/700',
    tools: ['Figma', 'Miro', 'UserTesting', 'Principle'],
    role: 'UX Researcher + Designer',
    timeline: '2023.06 – 2023.12 (7개월)',
    team: 'PM 1, 디자이너 2, 개발자 5, 의료 자문 1',
    tagline: '디지털 취약 계층을 위한\n접근 가능한 건강 관리',
    background: '네이버 클로바 헬스는 40~60대를 타깃으로 한 건강 관리 앱을 0에서 만드는 프로젝트였습니다. 문제는 타깃 사용자들이 스마트폰에 익숙하지 않다는 것.',
    problem: '앱을 만든 적 없는 사람들을 위한 앱을 어떻게 만드는가?',
    problemDetail: '팀 내부에서 설계한 초기 와이어프레임은 20~30대 기준으로 만들어진 것이었습니다. 작은 버튼, 많은 기능, 복잡한 네비게이션. 실제 타깃 사용자에게 보여줬을 때 반응은 냉담했습니다.',
    painPoints: [
      { label: '초기 프로토타입 태스크 완료율', stat: '31%' },
      { label: '타깃 사용자 스마트폰 사용 경력', stat: '평균 2.3년' },
      { label: 'WCAG 미충족 요소', stat: '47개' },
    ],
    researchMethods: ['현장 방문 인터뷰 (32명)', '다이어리 스터디 (4주)', '접근성 감사 (WCAG 2.1)', '의료진 전문가 인터뷰'],
    researchInsights: [
      { quote: '"글자가 너무 작아서 안경 써도 잘 안 보여요. 그냥 안 쓰게 되더라고요."', from: '인터뷰 참여자, 58세 주부' },
      { quote: '"뒤로 가기를 눌렀는데 앱이 꺼져버렸어요. 그다음부터는 무서워서 못 만지겠어요."', from: '인터뷰 참여자, 62세 은퇴자' },
      { quote: '"아들이 설치해줬는데 어디서 약 기록하는 건지 모르겠어요."', from: '인터뷰 참여자, 55세 자영업자' },
    ],
    researchImages: [
      'https://picsum.photos/seed/healthresearch1/800/500',
      'https://picsum.photos/seed/healthresearch2/800/500',
    ],
    processSteps: [
      {
        step: '01  페르소나 & 접근성 기준',
        desc: '3개의 페르소나를 정의하고, WCAG 2.1 AA 기준을 내부 디자인 기준으로 채택했습니다. 최소 터치 영역 44×44pt, 본문 폰트 최소 16sp 등.',
        image: 'https://picsum.photos/seed/healthprocess1/800/480',
      },
      {
        step: '02  단순화 실험',
        desc: '메뉴 항목을 6개에서 3개로 줄이는 A/B 테스트를 진행했습니다. 3개 메뉴 버전에서 태스크 완료율이 31% → 78%로 상승.',
        image: 'https://picsum.photos/seed/healthprocess2/800/480',
      },
      {
        step: '03  반복 현장 테스트',
        desc: '2주마다 실제 타깃 사용자 5명과 현장 테스트를 진행했습니다. 총 6회 반복. 매 라운드마다 10개 이상의 개선점을 발굴.',
        image: 'https://picsum.photos/seed/healthprocess3/800/480',
      },
    ],
    finalImages: [
      'https://picsum.photos/seed/healthfinal1/600/900',
      'https://picsum.photos/seed/healthfinal2/600/900',
      'https://picsum.photos/seed/healthfinal3/600/900',
    ],
    finalDesc: '큰 버튼, 큰 텍스트, 단순한 3개의 탭 네비게이션. 모든 주요 액션은 2탭 이내에서 접근 가능. 오류 메시지는 쉬운 말로, 항상 해결 방법을 함께 제시.',
    result: 'MAU 12,000명',
    resultSub: '출시 3개월 기준',
    metrics: [
      { label: '태스크 완료율', value: '91%', change: '↑60%p' },
      { label: '출시 3개월 MAU', value: '12,000', change: '목표 대비 +40%' },
      { label: '리텐션 (30일)', value: '61%', change: '업계 평균 2배' },
    ],
    learnings: [
      '접근성은 취약 계층만을 위한 것이 아닙니다. 접근성이 높은 디자인은 모든 사용자에게 더 쉽습니다.',
      '현장 테스트 없이는 타깃 사용자를 이해할 수 없었습니다. 인터뷰만으로는 부족했습니다.',
      '단순함은 결과물이 아니라 과정입니다. 줄이고 줄이고 또 줄이는 것.',
    ],
  },
  {
    id: '4',
    title: '커머스 앱 개편',
    subtitle: 'COUPANG · 2023',
    category: 'UX/UI',
    cover: 'https://picsum.photos/seed/commerce4/1200/700',
    tools: ['Figma', 'Maze', 'Protopie', 'GA4'],
    role: 'Senior UX Designer',
    timeline: '2023.03 – 2023.08 (6개월)',
    team: 'PM 2, 디자이너 3, 개발자 8, 데이터 분석가 1',
    tagline: '탐색을 줄이면\n구매가 늘어난다',
    background: '쿠팡 상품 탐색 단계에서의 전환율이 경쟁사 대비 17% 낮았습니다. 데이터는 문제를 알고 있었지만, 원인은 알 수 없었습니다.',
    problem: '사람들은 왜 상품을 보고도 담지 않는가?',
    problemDetail: '상품 목록 → 상세 → 장바구니 전환 퍼널에서 상세 페이지 이탈이 전체 이탈의 73%를 차지했습니다. 상세 페이지가 문제였지만, 어떤 요소인지는 불명확했습니다.',
    painPoints: [
      { label: '상세 페이지 이탈률', stat: '73%' },
      { label: '경쟁사 대비 전환율 차이', stat: '-17%' },
      { label: '평균 스크롤 깊이', stat: '34%' },
    ],
    researchMethods: ['GA4 퍼널 분석', '히트맵 & 스크롤맵 (Hotjar)', 'A/B 테스트 6라운드', '구매 완료/이탈 사용자 인터뷰 각 10명'],
    researchInsights: [
      { quote: '"배송 정보가 너무 아래 있어요. 로켓배송인지 아닌지 바로 알고 싶은데."', from: '이탈 사용자 인터뷰 D, 34세' },
      { quote: '"리뷰가 많아도 사진 리뷰가 없으면 믿음이 안 가서 안 사게 되더라고요."', from: '이탈 사용자 인터뷰 E, 29세' },
      { quote: '"옵션 선택하면 가격이 얼마인지 위에서 바로 업데이트되면 좋겠어요."', from: '구매 사용자 인터뷰 F, 41세' },
    ],
    researchImages: [
      'https://picsum.photos/seed/comresearch1/800/500',
      'https://picsum.photos/seed/comresearch2/800/500',
    ],
    processSteps: [
      {
        step: '01  핵심 가설 도출',
        desc: '히트맵 분석 결과 사용자들은 상세 페이지 상단 30%만 보고 이탈했습니다. "필요한 정보가 없어서 내려가지 않는다"는 가설을 세웠습니다.',
        image: 'https://picsum.photos/seed/comprocess1/800/480',
      },
      {
        step: '02  A/B 테스트 설계',
        desc: '6개의 가설을 순차적으로 A/B 테스트했습니다. 배송 정보 위치, 사진 리뷰 노출 방식, 옵션별 가격 실시간 표시, CTA 버튼 색상 등.',
        image: 'https://picsum.photos/seed/comprocess2/800/480',
      },
      {
        step: '03  승자 조합 통합',
        desc: '6회 테스트에서 유의미한 결과를 보인 4개 변수를 통합한 최종 디자인을 만들었습니다. 출시 전 Protopie로 전체 플로우 검증 완료.',
        image: 'https://picsum.photos/seed/comprocess3/800/480',
      },
    ],
    finalImages: [
      'https://picsum.photos/seed/comfinal1/600/900',
      'https://picsum.photos/seed/comfinal2/600/900',
      'https://picsum.photos/seed/comfinal3/600/900',
    ],
    finalDesc: '배송 정보와 사진 리뷰를 상단으로 올리고, 옵션 선택 시 가격을 실시간으로 업데이트. CTA 버튼을 sticky로 고정해 언제든 구매 진입 가능하도록.',
    result: '전환율 22% 상승',
    resultSub: '출시 2개월 기준',
    metrics: [
      { label: '상세→장바구니 전환율', value: '+22%', change: '경쟁사 수준 도달' },
      { label: '평균 스크롤 깊이', value: '61%', change: '↑27%p' },
      { label: '월 매출 기여', value: '+4.3억', change: 'ROI 340%' },
    ],
    learnings: [
      '데이터는 어디서 문제가 있는지 알려주지만, 왜 문제인지는 사용자만 압니다.',
      'A/B 테스트는 가설이 명확할 때 강력합니다. 가설 없는 테스트는 결과를 해석할 수 없습니다.',
      '작은 UI 변경 하나가 수억 원의 차이를 만들 수 있다는 것을 이 프로젝트에서 처음 실감했습니다.',
    ],
  },
]

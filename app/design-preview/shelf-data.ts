/** Hero shelf only — keep separate from full case studies to avoid bundling ~17KB of detail data. */
export type CaseStudyShelf = {
  id: string
  title: string
  category: string
}

export const CASE_STUDY_SHELF: CaseStudyShelf[] = [
  { id: '1', title: '금융 앱 리디자인', category: 'UX/UI' },
  { id: '2', title: 'B2B SaaS 대시보드', category: 'Product Design' },
  { id: '3', title: '헬스케어 앱 0→1', category: 'Research + UI' },
  { id: '4', title: '커머스 앱 개편', category: 'UX/UI' },
]

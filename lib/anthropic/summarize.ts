import Anthropic from '@anthropic-ai/sdk'

export type ProjectSummary = {
  description: string
  tech_highlights: string[]
}

/**
 * Uses Claude Haiku to summarize commit messages into a portfolio project description.
 */
export async function summarizeProjectFromCommits(
  apiKey: string,
  repoName: string,
  commitMessages: string[],
  languages: string[],
  repoDescription: string | null
): Promise<ProjectSummary> {
  const client = new Anthropic({ apiKey })

  const commitSample = commitMessages.slice(0, 80).join('\n')
  const langList = languages.slice(0, 8).join(', ')

  const prompt = `다음은 GitHub 레포 "${repoName}"의 커밋 내역입니다.

사용 언어: ${langList || '정보 없음'}
레포 설명: ${repoDescription || '없음'}

커밋 메시지 (최신순):
${commitSample}

위 정보를 바탕으로 개발자 포트폴리오용 프로젝트 소개를 작성해주세요.

규칙:
- description: 이 프로젝트가 무엇인지, 어떤 기능을 구현했는지 2~3문장으로 작성. 한국어로.
- tech_highlights: 커밋에서 발견되는 핵심 기술/구현 포인트 키워드 최대 5개 (짧게, 예: "JWT 인증", "실시간 채팅", "CI/CD 자동화")

JSON 형식으로만 응답 (다른 텍스트 없이):
{"description": "...", "tech_highlights": ["...", "..."]}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const parsed = JSON.parse(text) as ProjectSummary
    return {
      description: parsed.description ?? '',
      tech_highlights: Array.isArray(parsed.tech_highlights) ? parsed.tech_highlights : [],
    }
  } catch {
    return { description: text.slice(0, 300), tech_highlights: [] }
  }
}

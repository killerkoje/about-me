import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('anthropic_api_key')
    .eq('id', user.id)
    .single()

  if (!profile?.anthropic_api_key) {
    return new Response('Anthropic API 키가 없습니다. 설정에서 먼저 등록해주세요.', { status: 400 })
  }

  const { messages, repoContext } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    repoContext: string
  }

  const apiKey = decrypt(profile.anthropic_api_key)
  const client = new Anthropic({ apiKey })

  const systemPrompt = `당신은 개발자 포트폴리오 작성을 도와주는 AI 어시스턴트입니다.
아래는 분석할 GitHub 레포지토리의 전체 파일 내용입니다.

${repoContext}

이 코드베이스를 기반으로 사용자의 질문에 답변해주세요.
포트폴리오 작성, 프로젝트 설명, 기술 스택 정리, 구현 내용 요약 등을 도와주세요.
한국어로 답변해주세요.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        })

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '오류가 발생했습니다'
        controller.enqueue(encoder.encode(`\n\n[오류: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

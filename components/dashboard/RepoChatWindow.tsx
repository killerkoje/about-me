'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, ChevronLeft, Sparkles } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  repoName: string
  repoContext: string
  fileCount: number
  estimatedTokens: number
  onBack: () => void
}

const SUGGESTIONS = [
  '이 프로젝트를 포트폴리오용으로 3~5문장으로 요약해줘',
  '핵심 기능과 구현 방식을 설명해줘',
  '사용된 기술 스택과 아키텍처를 정리해줘',
  '이 프로젝트의 가장 인상적인 부분을 뽑아줘',
]

export default function RepoChatWindow({ repoName, repoContext, fileCount, estimatedTokens, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || streaming) return

    const userMsg: Message = { role: 'user', content }
    const nextMessages = [...messages, userMsg]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)
    setError(null)

    try {
      const res = await fetch('/api/chat/repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          repoContext,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
          return updated
        })
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '오류가 발생했습니다'
      setError(msg)
      setMessages(prev => prev.slice(0, -1)) // remove empty assistant msg
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const tokenCost = ((estimatedTokens / 1_000_000) * 0.8).toFixed(4)

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] min-h-[500px] max-h-[800px]">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 flex-shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-sm">{repoName}</h2>
            <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Sparkles size={9} /> AI 채팅
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {fileCount}개 파일 · 약 {estimatedTokens.toLocaleString()} 토큰 · 메시지당 ~${tokenCost}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">레포 파일이 로드됐습니다</p>
              <p className="text-xs text-gray-400 mt-1">아래 추천 질문을 클릭하거나 직접 입력하세요</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-md">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm text-gray-600 border border-gray-100 rounded-xl px-4 py-2.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              m.role === 'user' ? 'bg-indigo-600' : 'bg-gray-100'
            }`}>
              {m.role === 'user'
                ? <User size={13} className="text-white" />
                : <Bot size={13} className="text-gray-500" />
              }
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-50 text-gray-800'
            }`}>
              {m.content
                ? <span className="whitespace-pre-wrap">{m.content}</span>
                : <Loader2 size={14} className="animate-spin text-gray-400" />
              }
            </div>
          </div>
        ))}

        {error && (
          <p className="text-xs text-red-500 text-center px-4">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요... (Enter로 전송, Shift+Enter 줄바꿈)"
            disabled={streaming}
            rows={2}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60 resize-none leading-relaxed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            {streaming
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

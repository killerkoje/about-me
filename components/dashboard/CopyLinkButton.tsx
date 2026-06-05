'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
    >
      {copied ? (
        <><Check size={12} />복사됨</>
      ) : error ? (
        <><Copy size={12} />실패</>
      ) : (
        <><Copy size={12} />링크 복사</>
      )}
    </button>
  )
}

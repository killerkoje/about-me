'use client'
import { useState } from 'react'
import { Key, Trash2, Eye, EyeOff, Check } from 'lucide-react'
import { saveApiKey, deleteApiKey } from '@/app/(dashboard)/dashboard/settings/actions'

type Props = {
  hasKey: boolean
}

export default function ApiKeyForm({ hasKey }: Props) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setSaving(true)
    setError(null)
    try {
      await saveApiKey(value.trim())
      setSaved(true)
      setValue('')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('API 키를 삭제하시겠습니까? GitHub 분석을 사용할 수 없게 됩니다.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteApiKey()
    } catch {
      setError('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {hasKey && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <Check size={16} className="text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-700">API 키가 등록되어 있습니다</p>
            <p className="text-xs text-emerald-600 mt-0.5">새 키를 입력하면 덮어쓰기됩니다</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={13} />
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div>
          <label htmlFor="api-key" className="text-sm font-medium text-gray-700 mb-1 block">
            Anthropic API 키
          </label>
          <p className="text-xs text-gray-500 mb-2">
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
            >
              console.anthropic.com
            </a>
            에서 발급. GitHub 분석 시 커밋 요약에 사용됩니다.
          </p>
          <div className="relative">
            <input
              id="api-key"
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving || !value.trim()}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 self-start transition-colors"
        >
          <Key size={14} />
          {saved ? '저장됨 ✓' : saving ? '저장 중...' : 'API 키 저장'}
        </button>
      </form>
    </div>
  )
}

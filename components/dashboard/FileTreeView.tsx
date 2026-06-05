'use client'
import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'

type TreeNode = {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: TreeNode[]
}

function buildTree(paths: string[]): TreeNode[] {
  const root: Record<string, unknown> = {}

  for (const filePath of paths) {
    const parts = filePath.split('/')
    let cur: Record<string, unknown> = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        if (!(part in cur)) cur[part] = null
      } else {
        if (!cur[part]) cur[part] = {}
        cur = cur[part] as Record<string, unknown>
      }
    }
  }

  function toNodes(obj: Record<string, unknown>, base: string): TreeNode[] {
    return Object.entries(obj)
      .sort(([, av], [, bv]) => {
        const af = av !== null, bf = bv !== null
        if (af !== bf) return af ? -1 : 1
        return 0
      })
      .sort(([a, av], [b, bv]) => {
        if ((av !== null) === (bv !== null)) return a.localeCompare(b)
        return 0
      })
      .map(([name, children]) => {
        const path = base ? `${base}/${name}` : name
        if (children === null) return { name, path, type: 'file' as const }
        return { name, path, type: 'folder' as const, children: toNodes(children as Record<string, unknown>, path) }
      })
  }

  return toNodes(root, '')
}

// File extension → color class
const EXT_COLOR: Record<string, string> = {
  ts: '#3b82f6', tsx: '#60a5fa',
  js: '#eab308', jsx: '#facc15',
  css: '#ec4899', scss: '#f472b6', sass: '#f472b6',
  json: '#f59e0b', yaml: '#f59e0b', yml: '#f59e0b', toml: '#f59e0b',
  md: '#9ca3af', mdx: '#9ca3af',
  py: '#22c55e', go: '#06b6d4',
  rs: '#f97316', java: '#ef4444',
  kt: '#a855f7', swift: '#fb923c',
  dart: '#38bdf8', html: '#fb7185',
  sql: '#93c5fd', prisma: '#818cf8',
  sh: '#84cc16', bash: '#84cc16',
  graphql: '#e879f9', gql: '#e879f9',
  php: '#818cf8', rb: '#f87171',
}

function FileIcon({ name }: { name: string }) {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : name.toLowerCase()
  const color = EXT_COLOR[ext] ?? '#9ca3af'
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TreeItem({ node, depth, defaultOpen }: { node: TreeNode; depth: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const indent = depth * 14 + 8

  if (node.type === 'file') {
    return (
      <div
        className="flex items-center gap-1.5 py-[3px] rounded hover:bg-gray-100 select-none"
        style={{ paddingLeft: `${indent}px`, paddingRight: '8px' }}
      >
        <FileIcon name={node.name} />
        <span className="text-[12px] text-gray-700 truncate leading-none">{node.name}</span>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 py-[3px] rounded hover:bg-gray-100 w-full text-left"
        style={{ paddingLeft: `${indent}px`, paddingRight: '8px' }}
      >
        {open
          ? <ChevronDown size={11} className="text-gray-400 flex-shrink-0" />
          : <ChevronRight size={11} className="text-gray-400 flex-shrink-0" />
        }
        {open
          ? <FolderOpen size={13} className="flex-shrink-0" style={{ color: '#fbbf24' }} />
          : <Folder size={13} className="flex-shrink-0" style={{ color: '#fbbf24' }} />
        }
        <span className="text-[12px] font-medium text-gray-800 truncate leading-none">{node.name}</span>
      </button>
      {open && node.children && (
        <div>
          {node.children.map(child => (
            <TreeItem key={child.path} node={child} depth={depth + 1} defaultOpen={depth < 1} />
          ))}
        </div>
      )}
    </div>
  )
}

type Props = {
  filePaths: string[]
  repoName: string
}

export default function FileTreeView({ filePaths, repoName }: Props) {
  const tree = useMemo(() => buildTree(filePaths), [filePaths])

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* VS Code-style header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{repoName}</span>
        <span className="text-[10px] text-gray-400">{filePaths.length}개 파일</span>
      </div>
      <div className="py-1 max-h-[400px] overflow-y-auto font-mono">
        {tree.map(node => (
          <TreeItem key={node.path} node={node} depth={0} defaultOpen />
        ))}
      </div>
    </div>
  )
}

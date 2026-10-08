'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  History, Trash2, RotateCcw, Clock, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/jobs'

export function AiHistorySection({ type, onLoad }: { type: 'interview_prep' | 'career_roadmap'; onLoad: (result: any, input: any) => void }) {
  const { user, openAuth } = useApp()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.aiHistory(type)
        if (active) setHistory(res.generations || [])
      } catch {}
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [user, type])

  const handleLoad = async (id: string) => {
    try {
      const res = await api.aiHistoryItem(id)
      const gen = res.generation
      if (gen) {
        let result: any
        try { result = JSON.parse(gen.result) } catch { result = { raw: gen.result } }
        let input: any = null
        try { if (gen.input) input = JSON.parse(gen.input) } catch {}
        onLoad(result, input)
        toast.success('Loaded from history')
      }
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAiGeneration(id)
      setHistory((prev) => prev.filter((h) => h.id !== id))
      toast.success('Deleted from history')
    } catch (e: any) { toast.error(e.message) }
  }

  if (!user) return null
  if (loading) return (
    <Card className="p-4 mt-5">
      <div className="flex items-center gap-2 mb-3">
        <History className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">History</h3>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
    </Card>
  )
  if (history.length === 0) return null

  return (
    <Card className="p-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">History</h3>
            <p className="text-[10px] text-muted-foreground">{history.length} saved {type === 'interview_prep' ? 'prep guides' : 'roadmaps'}</p>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {history.slice(0, 5).map((h) => (
          <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group">
            <button
              onClick={() => handleLoad(h.id)}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
            >
              <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Clock className="size-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{h.title}</p>
                <p className="text-[10px] text-muted-foreground">{timeAgo(h.createdAt)}</p>
              </div>
            </button>
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleLoad(h.id)}
                className="size-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Load"
                aria-label="Load from history"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                onClick={() => handleDelete(h.id)}
                className="size-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Delete"
                aria-label="Delete from history"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

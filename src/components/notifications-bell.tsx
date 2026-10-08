'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api'
import { Bell, Check, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { timeAgo } from '@/lib/jobs'

export function NotificationsBell() {
  const user = useApp((s) => s.user)
  const notifications = useApp((s) => s.notifications)
  const notificationsVersion = useApp((s) => s.notificationsVersion)
  const refreshNotifications = useApp((s) => s.refreshNotifications)
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

  // refresh on mount and when the version is bumped externally
  useEffect(() => {
    if (user) refreshNotifications()
  }, [user, notificationsVersion, refreshNotifications])

  const markAll = async () => { await api.markAllNotificationsRead(); refreshNotifications() }
  const markOne = async (id: string) => { await api.markNotificationRead(id, true); refreshNotifications() }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative size-9 inline-flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h4 className="text-sm font-semibold">Notifications</h4>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAll}>
              <Check className="size-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="size-8 mx-auto mb-2 opacity-30" />
              You're all caught up.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 flex gap-3 ${!n.read ? 'bg-accent/30' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <button onClick={() => markOne(n.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                        {!n.read ? <Check className="size-3.5" /> : <X className="size-3.5 opacity-40" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getNotifications } from '@/lib/api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface NotificationItem {
  id: number | string
  type: string
  title?: string
  message?: string
  created_at?: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      try {
        if (token) {
          const res = await getNotifications(token)
          setItems(res || [])
          return
        }
      } catch (e) {
        console.warn('Notifications API failed, showing demo')
      }
      // Demo / fallback
      setItems([
        { id: '1', type: 'request', title: 'Item Listing Request', message: 'Akash requested to list "Canon DSLR"', created_at: new Date().toISOString() },
        { id: '2', type: 'message', title: 'New Message', message: 'Rahul sent you a message about Calculator', created_at: new Date().toISOString() },
        { id: '3', type: 'booking', title: 'New Booking', message: 'Your tripod is booked for 3 days', created_at: new Date().toISOString() },
      ])
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-2xl font-bold text-[#2563eb]">Notifications</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
        {items.map((n) => (
          <div key={n.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${n.type==='message' ? 'bg-[#eef2ff] text-[#4c40f5]' : n.type==='booking' ? 'bg-[#ecfdf3] text-[#16a34a]' : 'bg-[#fff9ed] text-[#f59e0b]'}`}>
              {n.type==='message' && (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4z"/></svg>
              )}
              {n.type==='request' && (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z"/><path d="M9 12l2 2 4-4"/></svg>
              )}
              {n.type==='booking' && (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h18v18H3z"/><path d="M3 10h18"/></svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1c1c1e]">{n.title || n.type}</p>
              <p className="text-xs text-[#7b819a] mt-0.5">{n.message}</p>
            </div>
            <div className="text-[11px] text-[#a1a6bc]">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-[#a1a6bc]">No notifications</div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  id: number
  listing_id: number
  sender_id: string
  content: string
  created_at: string
}

export default function ChatPage() {
  const params = useParams() as { id?: string }
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    const fetchMessages = async () => {
      if (!params?.id) return
      try {
        const { data } = await supabase
          .from('messages')
          .select('id, listing_id, sender_id, content, created_at')
          .eq('listing_id', Number(params.id))
          .order('created_at', { ascending: true })
        setMessages((data as any) || [])
      } catch {
        // If table missing, keep UI usable without persistence
        setMessages([])
      }
    }
    fetchMessages()
    const t = setInterval(fetchMessages, 5000)
    return () => clearInterval(t)
  }, [params?.id])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Please login to chat'); return }
    setInput('')
    try {
      const { error } = await supabase
        .from('messages')
        .insert({ listing_id: Number(params.id), sender_id: user.id, content: text })
      if (error) throw error
      setMessages((prev) => [...prev, { id: Date.now(), listing_id: Number(params.id), sender_id: user.id, content: text, created_at: new Date().toISOString() }])
    } catch {
      // fallback local append
      setMessages((prev) => [...prev, { id: Date.now(), listing_id: Number(params.id), sender_id: 'me', content: text, created_at: new Date().toISOString() }])
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/listing/${params.id}`} className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-2xl font-bold text-[#2563eb]">Chat</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 h-[60vh] overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-xs px-3 py-2 rounded-xl text-sm ${m.sender_id === 'me' ? 'bg-[#4c40f5] text-white ml-auto' : 'bg-[#eef2ff] text-[#1f2433]'} `}>
              {m.content}
              <div className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-[#a1a6bc]">Start a conversation about this item.</p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            className="flex-1 px-4 py-3 rounded-xl border border-[#e5e8f2] bg-white text-sm text-[#1f2433] focus:outline-none focus:border-[#4c40f5]"
          />
          <button onClick={sendMessage} className="px-4 py-3 rounded-xl bg-[#4c40f5] text-white text-sm font-semibold shadow-lg">Send</button>
        </div>
      </div>
    </div>
  )
}

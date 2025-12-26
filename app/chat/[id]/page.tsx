'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { buildWsUrl, getMessages as fetchApiMessages, sendMessage as sendApiMessage } from '@/lib/api'

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
  image_url?: string
}

export default function ChatPage() {
  const params = useParams() as { id?: string }
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [token, setToken] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    const loadToken = async () => {
      const { data } = await supabase.auth.getSession()
      const access = data?.session?.access_token || ''
      setToken(access)
    }
    loadToken()
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      if (!params?.id) return
      try {
        if (token) {
          const data = await fetchApiMessages(params.id, token)
          setMessages(data || [])
          return
        }
      } catch (e) {
        console.warn('API messages failed, fallback to supabase', e)
      }
      try {
        const { data } = await supabase
          .from('messages')
          .select('id, listing_id, sender_id, content, created_at')
          .eq('listing_id', Number(params.id))
          .order('created_at', { ascending: true })
        setMessages((data as any) || [])
      } catch {
        setMessages([])
      }
    }
    fetchMessages()
  }, [params?.id, token])

  useEffect(() => {
    if (!params?.id) return
    const wsUrl = buildWsUrl(`/ws?listing_id=${params.id}`)
    if (!wsUrl) return
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg?.content) {
          setMessages((prev) => [...prev, msg])
        }
      } catch {/* ignore parse errors */}
    }
    return () => ws.close()
  }, [params?.id])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Please login to chat'); return }
    setInput('')
    try {
      if (token) {
        await sendApiMessage(params.id as string, text, token)
        setMessages((prev) => [...prev, { id: Date.now(), listing_id: Number(params.id), sender_id: user.id, content: text, created_at: new Date().toISOString() }])
        return
      }
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
            <div key={m.id} className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.sender_id === 'me' ? 'bg-[#4c40f5] text-white ml-auto' : 'bg-[#eef2ff] text-[#1f2433]'} `}>
              {m.image_url && (
                <img src={m.image_url} alt="attachment" className="rounded-xl mb-2 max-h-48" />
              )}
              {m.content}
              <div className={`text-[10px] mt-1 ${m.sender_id === 'me' ? 'opacity-80' : 'opacity-60'}`}>{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-[#a1a6bc]">Start a conversation about this item.</p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <label className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#4c40f5] flex items-center justify-center cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="14" rx="3"/><circle cx="12" cy="14" r="3"/></svg>
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            className="flex-1 px-4 py-3 rounded-xl border border-[#e5e8f2] bg-white text-sm text-[#1f2433] focus:outline-none focus:border-[#4c40f5]"
          />
          <button onClick={async () => {
            // If image selected, upload first
            let imageUrl: string | undefined
            if (imageFile) {
              try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  const ext = imageFile.name.split('.').pop()
                  const path = `chat_${user.id}_${Date.now()}.${ext}`
                  const { data, error } = await supabase.storage.from('chat-images').upload(path, imageFile)
                  if (!error) {
                    const { data: pub } = await supabase.storage.from('chat-images').getPublicUrl(data.path)
                    imageUrl = pub.publicUrl
                  }
                }
              } catch {}
            }
            // send text (and image url if present)
            await sendMessage()
            if (imageUrl) {
              setMessages((prev) => [...prev, { id: Date.now(), listing_id: Number(params.id), sender_id: 'me', content: '', image_url: imageUrl, created_at: new Date().toISOString() }])
              setImageFile(null)
            }
          }} className="px-4 py-3 rounded-xl bg-[#4c40f5] text-white text-sm font-semibold shadow-lg">Send</button>
        </div>
      </div>
    </div>
  )
}

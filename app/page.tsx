'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Session } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Category {
  id: number
  name: string
  icon?: string
}

interface Listing {
  id: number
  title: string
  description: string
  price: number
  category_id: number
  image_urls: string[]
  user_id: string
  created_at: string
}

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (!session) return

    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (!error && data) {
        setCategories(data)
      }
    }

    fetchCategories()
  }, [session])

  useEffect(() => {
    if (!session) return

    const fetchListings = async () => {
      let query = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      const { data, error } = await query
      
      if (!error && data) {
        setListings(data)
      }
    }

    fetchListings()
  }, [selectedCategory, session])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#2563eb]">CampusRent</h1>
          <Link href="/notifications" className="relative">
            <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8v4l-2 2h20l-2-2V8" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </Link>
        </div>
      </header>

      {/* Categories area */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1f2433]">Categories</h2>
            <button className="text-sm font-medium text-[#2563eb]">Reset</button>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {/* All chip */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 w-[72px] text-center ${selectedCategory===null? '':'opacity-70'}`}
            >
              <div className={`mx-auto w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center ${selectedCategory===null? 'bg-[#eef2ff] text-[#4c40f5]':'bg-white text-[#7b819a]'}`}>
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11h18M12 3v18"/></svg>
              </div>
              <div className="mt-2 text-[11px] text-[#72788f]">All</div>
            </button>
            {categories.map((category) => (
              <button key={category.id} onClick={() => setSelectedCategory(category.id)} className="flex-shrink-0 w-[72px] text-center">
                <div className={`mx-auto w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center ${selectedCategory===category.id? 'bg-[#eef2ff] text-[#4c40f5]':'bg-white text-[#7b819a]'}`}>
                  {/* Simple icon placeholder */}
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>
                </div>
                <div className="mt-2 text-[11px] text-[#72788f] truncate">{category.name}</div>
              </button>
            ))}
          </div>
          {/* Range slider mimic */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-[#e5e8f2] rounded-full relative">
              <div className="w-2/3 h-2 bg-[#4c40f5] rounded-full"></div>
            </div>
            <div className="w-1.5 h-2 bg-[#1f2433] rounded-sm" />
          </div>
        </div>
      </section>

      {/* Trending items */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1f2433]">Trending Items</h2>
          <button className="p-2 rounded-full border border-[#e5e8f2] text-[#7b819a]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
          </button>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No listings available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mt-3">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="relative aspect-[4/3] bg-[#eef1f7]">
                  {listing.image_urls && listing.image_urls[0] ? (
                    <Image src={listing.image_urls[0]} alt={listing.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#aab0c5]">No Image</div>
                  )}
                  {/* Rating badge */}
                  <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white shadow text-[11px] text-[#7b819a]">
                    <span className="text-[#f59e0b]">★</span>
                    <span>4.8</span>
                  </div>
                  {/* Favorite */}
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#f59e0b]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-[#1f2433] line-clamp-2">{listing.title}</h3>
                  <div className="mt-1 flex items-center text-[12px] text-[#7b819a]">
                    <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    Hostel Block C
                  </div>
                  <p className="mt-2 text-[#2563eb] font-bold">₹{listing.price}<span className="text-xs text-[#7b819a]">/day</span></p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation (5 tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-5 h-16 text-[#72788f]">
            <Link href="/" className="flex flex-col items-center justify-center text-[#2563eb]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12l9-9 9 9"/><path d="M9 21V9h6v12"/></svg>
              <span className="text-[11px] mt-1 font-medium">Explore</span>
            </Link>
            <Link href="/search" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <span className="text-[11px] mt-1 font-medium">Search</span>
            </Link>
            <Link href="/my-gear" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h18v10H3z"/><path d="M8 7v-2h8v2"/></svg>
              <span className="text-[11px] mt-1 font-medium">My Gear</span>
            </Link>
            <Link href="/wallet" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="17" cy="12" r="1.5"/></svg>
              <span className="text-[11px] mt-1 font-medium">Wallet</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8"/></svg>
              <span className="text-[11px] mt-1 font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}

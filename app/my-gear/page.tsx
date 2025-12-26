'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MyGearPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory')
  const [userListings, setUserListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserListings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setUserListings(data)
      setLoading(false)
    }
    fetchUserListings()
  }, [router])

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#2563eb]">{activeTab === 'inventory' ? 'Inventory' : 'Rent Manager'}</h1>
          <Link href="/notifications" className="relative">
            <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 006 8v4l-2 2h20l-2-2V8" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-[#1c1c1e]">My Gear Dashboard</h2>
          <Link href="/add-item" className="w-12 h-12 rounded-full bg-[#4c40f5] flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'inventory'
                ? 'bg-white text-[#4c40f5] shadow-sm'
                : 'bg-transparent text-[#a1a6bc]'
            }`}
          >
            Inventory ({userListings.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-white text-[#4c40f5] shadow-sm'
                : 'bg-transparent text-[#a1a6bc]'
            }`}
          >
            Orders (0)
          </button>
        </div>

        {/* Content */}
        {activeTab === 'inventory' && (
          <div>
            <h3 className="text-xs font-semibold text-[#a1a6bc] tracking-wide mb-3">LISTED ITEMS</h3>
            {loading ? (
              <div className="text-center py-12 text-[#7b819a]">Loading...</div>
            ) : userListings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-[#f6f7fb] flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-[#c5c9d8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 7h18v10H3z" />
                    <path d="M8 7v-2h8v2" />
                  </svg>
                </div>
                <p className="text-[#a1a6bc] font-semibold">No Gear Listed Yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userListings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-[#1f2433]">{listing.title}</h4>
                    <p className="text-sm text-[#7b819a] mt-1">₹{listing.price}/day</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h3 className="text-xs font-semibold text-[#a1a6bc] tracking-wide mb-3">CURRENT RENTALS</h3>
            <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-[#f6f7fb] flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-[#c5c9d8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <path d="M9 12h6" />
                </svg>
              </div>
              <p className="text-[#a1a6bc] font-semibold">No Active Orders</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-5 h-16 text-[#72788f]">
            <Link href="/" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12l9-9 9 9" /><path d="M9 21V9h6v12" /></svg>
              <span className="text-[11px] mt-1 font-medium">Explore</span>
            </Link>
            <Link href="/search" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <span className="text-[11px] mt-1 font-medium">Search</span>
            </Link>
            <Link href="/my-gear" className="flex flex-col items-center justify-center text-[#2563eb]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h18v10H3z" /><path d="M8 7v-2h8v2" /></svg>
              <span className="text-[11px] mt-1 font-medium">My Gear</span>
            </Link>
            <Link href="/wallet" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="17" cy="12" r="1.5" /></svg>
              <span className="text-[11px] mt-1 font-medium">Wallet</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8" /></svg>
              <span className="text-[11px] mt-1 font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}

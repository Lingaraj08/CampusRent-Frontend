'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { createBooking } from '@/lib/api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

declare global {
  interface Window { Razorpay: any }
}

export default function ListingDetailPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [days, setDays] = useState<number>(3)
  const [ownerName, setOwnerName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  useEffect(() => {
    const fetchListing = async () => {
      if (!params?.id) return

      // Demo listing fallback for quick preview
      if (params.id === 'demo') {
        setListing({
          id: 'demo',
          title: 'Scientific Calculator Casio FX-991ES',
          description: 'Perfect for engineering students. Used for 2 semesters.',
          price: 90,
          meeting_location: 'Hostel Block C, IIT Bombay',
          image_urls: ['https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80'],
          user_id: 'demo-owner',
        })
        setOwnerName('Rahul S.')
        setLoading(false)
        return
      }
      setLoading(true)
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('id', Number(params.id))
        .single()
      setListing(data)

      if (data?.user_id) {
        // Try to resolve owner display name from profiles or auth metadata
        let name = ''
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username, name')
            .eq('id', data.user_id)
            .single()
          name = profile?.full_name || profile?.username || profile?.name || ''
        } catch {}
        if (!name) {
          const { data: userRes } = await supabase.auth.getUser()
          name = userRes?.user?.user_metadata?.username || 'Student'
        }
        setOwnerName(name)
      }
      setLoading(false)
    }
    fetchListing()
  }, [params?.id])

  const total = useMemo(() => {
    const pricePerDay = Number(listing?.price || 0)
    const platformFee = 15
    return pricePerDay * days + platformFee
  }, [listing, days])

  const rentNow = async () => {
    if (!listing) return
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      router.push('/auth/login')
      return
    }
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
      amount: total * 100,
      currency: 'INR',
      name: 'CampusRent',
      description: 'Item Rental Payment',
      handler: async function (response: any) {
        alert('Payment successful! ' + response.razorpay_payment_id)
        // Record booking in backend if token available
        if (token) {
          try {
            await createBooking({
              listing_id: listing.id,
              days,
              amount: total,
              payment_id: response.razorpay_payment_id,
            }, token)
          } catch (e) {
            console.warn('Booking API failed', e)
          }
        }
        router.push('/my-gear?tab=orders')
      },
      prefill: {
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
      },
      theme: { color: '#4c40f5' },
    }
    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
        <p className="text-sm text-[#7b819a]">Loading item...</p>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
        <p className="text-sm text-[#d14343]">Item not found</p>
      </div>
    )
  }

  const firstImage = (listing.image_urls?.[0]) || ''

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <Link href="/notifications" className="relative">
            <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 006 8v4l-2 2h20l-2-2V8" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </Link>
        </div>
      </header>

      {/* Hero Image */}
      {firstImage && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <img src={firstImage} className="w-full h-64 object-cover rounded-2xl" alt={listing.title} />
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Title and availability */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1c1c1e]">{listing.title}</h1>
              {listing.meeting_location && (
                <div className="flex items-center gap-2 mt-2 text-[#7b819a] text-xs">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 7 7 13 7 13s7-6 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  <span>{listing.meeting_location}</span>
                </div>
              )}
            </div>
            <span className="px-4 py-2 rounded-full text-xs font-bold bg-[#d1fae5] text-[#065f46]">AVAILABLE</span>
          </div>

          {/* Shared by + chat */}
          <div className="mt-6 flex items-center justify-between bg-[#f7f9ff] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#eef2ff] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#4c40f5]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8fa2ff] uppercase tracking-wider">Shared by</p>
                <p className="text-sm font-semibold text-[#1c1c1e]">{ownerName || 'Owner'}</p>
              </div>
            </div>
            <Link href={`/chat/${listing.id}`} className="px-5 py-2 rounded-full bg-[#4c40f5] text-white text-sm font-semibold shadow-lg">Chat</Link>
          </div>
        </div>

        {/* Product details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-[#4c40f5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <h3 className="text-sm font-semibold text-[#1c1c1e]">Product Details</h3>
          </div>
          <p className="text-sm text-[#7b819a]">{listing.description || 'No description provided.'}</p>
        </div>

        {/* Community verified */}
        <div className="bg-[#ecfdf5] rounded-2xl border border-[#d1fae5] p-6 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z"/><path d="M9 12l2 2 4-4"/></svg>
            <p className="text-sm font-bold text-[#065f46]">Community Verified</p>
          </div>
          <p className="text-xs text-[#065f46] font-medium">Direct peer-to-peer delivery. Coordinate a safe public spot on campus.</p>
        </div>

        {/* Duration selector */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-24">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-[#4c40f5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="4"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <h3 className="text-sm font-semibold text-[#1c1c1e]">Select Rental Duration</h3>
          </div>
          <div className="flex items-center justify-between bg-[#f7f9ff] rounded-2xl p-4">
            <button onClick={() => setDays(Math.max(1, days - 1))} className="w-12 h-12 rounded-2xl bg-white border border-[#e5e8f2] text-[#4c40f5] text-2xl font-bold">-</button>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-[#1c1c1e]">{days}</p>
              <p className="text-xs font-semibold text-[#a1a6bc] tracking-wide">DAYS</p>
            </div>
            <button onClick={() => setDays(days + 1)} className="w-12 h-12 rounded-2xl bg-white border border-[#e5e8f2] text-[#4c40f5] text-2xl font-bold">+</button>
          </div>
          <p className="text-[11px] text-center text-[#a1a6bc] mt-3 font-medium">Note: Late returns attract a ₹50 fine every 6 hours.</p>
        </div>
      </div>

      {/* Bottom payable bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#a1a6bc]">Payable Total</p>
            <p className="text-xl font-extrabold text-[#1c1c1e]">₹{total}</p>
            <p className="text-[11px] text-[#7b819a]">₹{listing.price}/day × {days} + ₹15 platform fee</p>
          </div>
          <button onClick={rentNow} className="px-6 py-3 rounded-full bg-[#4c40f5] text-white text-sm font-semibold shadow-lg">Rent Now</button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-5 h-16 text-[#72788f]">
            <Link href="/" className="flex flex-col items-center justify-center text-[#2563eb]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12l9-9 9 9" /><path d="M9 21V9h6v12" /></svg>
              <span className="text-[11px] mt-1 font-medium">Explore</span>
            </Link>
            <Link href="/search" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <span className="text-[11px] mt-1 font-medium">Search</span>
            </Link>
            <Link href="/my-gear" className="flex flex-col items-center justify-center">
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

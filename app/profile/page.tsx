'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [rentalsCount, setRentalsCount] = useState(0)
  const [earnings, setEarnings] = useState(0)
  const [displayName, setDisplayName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [collegeEmail, setCollegeEmail] = useState<string>('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Derive display data from metadata
      const md: any = user.user_metadata || {}
      const nameCandidate = md.full_name || md.username || md.name || (user.email ? user.email.split('@')[0] : '')
      setDisplayName(nameCandidate)
      setPhoneNumber(md.phone || md.phone_number || '')
      setCollegeEmail(md.college_email || md.institutional_email || '')

      // Resolve avatar/selfie URL from common metadata keys
      const directUrl = md.avatar_url || md.selfie_url || md.profile_photo || md.photo_url
      const storagePath = md.selfie_path || md.avatar_path || md.photo_path

      if (directUrl) {
        setAvatarUrl(directUrl)
      } else if (storagePath) {
        // Try creating a signed URL from kyc-files bucket; fall back silently if it fails
        try {
          const { data } = await supabase.storage.from('kyc-files').createSignedUrl(storagePath, 600)
          if (data?.signedUrl) setAvatarUrl(data.signedUrl)
        } catch {
          // ignore storage resolving errors
        }
      }

      // Fetch user's rentals count
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', user.id)

      if (listings) setRentalsCount(listings.length)
    }
    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#2563eb]">Profile</h1>
          <Link href="/notifications" className="relative">
            <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 006 8v4l-2 2h20l-2-2V8" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {user && (
          <>
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#c7bfff] to-[#a99fff] flex items-center justify-center shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-extrabold text-[#4c40f5]">
                      {(displayName || user.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#1c1c1e]">{displayName}</h2>
                  <p className="text-xs font-bold text-[#16a34a] tracking-wide mt-1">STUDENT VERIFIED</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {phoneNumber && (
                      <span className="px-2 py-1 text-xs rounded-full bg-[#eef2ff] text-[#1f2433] font-semibold">{phoneNumber}</span>
                    )}
                    <span className="px-2 py-1 text-xs rounded-full bg-[#eef2ff] text-[#1f2433] font-semibold">
                      {collegeEmail || user.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* My Rentals */}
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <p className="text-4xl font-extrabold text-[#4c40f5] mb-1">{rentalsCount}</p>
                <p className="text-xs font-semibold text-[#a1a6bc] tracking-wide">MY RENTALS</p>
              </div>
              {/* Earnings */}
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <p className="text-4xl font-extrabold text-[#16a34a] mb-1">₹{earnings}</p>
                <p className="text-xs font-semibold text-[#a1a6bc] tracking-wide">EARNINGS</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-3">
              {/* Inventory */}
              <Link href="/my-gear" className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 hover:bg-[#f6f7fb] transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#4c40f5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[#1f2433]">Inventory</span>
                </div>
                <svg className="w-5 h-5 text-[#c5c9d8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>

              {/* Manage Incoming Rents */}
              <Link href="/my-gear?tab=orders" className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 hover:bg-[#f6f7fb] transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#4c40f5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[#1f2433]">Manage Incoming Rents</span>
                </div>
                <svg className="w-5 h-5 text-[#c5c9d8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>

              {/* Payouts & Wallet */}
              <Link href="/wallet" className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 hover:bg-[#f6f7fb] transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#eef2ff] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#4c40f5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 3h12l3 3v15H3V6l3-3z"/>
                      <path d="M9 3v3h6V3"/>
                      <path d="M12 11v6"/>
                      <path d="M9 14h6"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[#1f2433]">Payouts & Wallet</span>
                </div>
                <svg className="w-5 h-5 text-[#c5c9d8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 hover:bg-[#fef2f2] transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#ef4444]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-[#ef4444]">SIGN OUT</span>
                </div>
                <svg className="w-5 h-5 text-[#fca5a5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </>
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
            <Link href="/my-gear" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h18v10H3z" /><path d="M8 7v-2h8v2" /></svg>
              <span className="text-[11px] mt-1 font-medium">My Gear</span>
            </Link>
            <Link href="/wallet" className="flex flex-col items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="17" cy="12" r="1.5" /></svg>
              <span className="text-[11px] mt-1 font-medium">Wallet</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center justify-center text-[#2563eb]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8" /></svg>
              <span className="text-[11px] mt-1 font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}

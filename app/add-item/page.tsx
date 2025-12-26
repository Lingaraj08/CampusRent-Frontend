'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

declare global {
  interface Window { Razorpay: any }
}

export default function AddItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [images, setImages] = useState<File[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    meeting_location: '',
  })

  // Load Razorpay script for platform fee payments
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5)
      setImages(files)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Charge platform fee (₹30) per listing before proceeding
      const feePaid = await new Promise<boolean>((resolve) => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
          amount: 30 * 100,
          currency: 'INR',
          name: 'CampusRent',
          description: 'Listing Platform Fee',
          handler: function () { resolve(true) },
          prefill: { name: user.user_metadata?.full_name || user.email, email: user.email },
          theme: { color: '#4c40f5' },
        }
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      })

      if (!feePaid) {
        alert('Platform fee payment required to publish listing.')
        setLoading(false)
        return
      }

      // Upload images
      const imageUrls: string[] = []
      for (const image of images) {
        try {
          const ext = image.name.split('.').pop()
          const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
          const { data, error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, image)

          if (uploadError) {
            // Add helpful hint when bucket is missing or not public
            const hint = uploadError.message?.toLowerCase().includes('does not exist')
              ? 'Create a public bucket named "listing-images" in Supabase Storage and enable public access.'
              : uploadError.message
            throw new Error(hint || 'Image upload failed')
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(data.path)
          
          imageUrls.push(publicUrl)
        } catch (uploadErr: any) {
          throw uploadErr
        }
      }

      // Create listing
      const { error: insertError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: parseInt(formData.category_id),
          image_urls: imageUrls,
          meeting_location: formData.meeting_location,
        })

      if (insertError) throw insertError

      alert('Item listed successfully!')
      router.push('/my-gear')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#2563eb]">Inventory</h1>
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
        <h2 className="text-xl font-extrabold text-[#1c1c1e] mb-4">Share New Item</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#1c1c1e] mb-4">List Your Item</h3>

            {/* Image Upload */}
            <label className="block mb-4">
              <div className="w-full h-48 rounded-2xl border-2 border-dashed border-[#d5d9ea] bg-[#f7f9ff] flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <svg className="w-12 h-12 text-[#a8b0da] mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="7" width="18" height="14" rx="3" />
                  <circle cx="12" cy="14" r="3" />
                </svg>
                <span className="text-sm font-semibold text-[#4c40f5]">Add Photos</span>
                <span className="text-xs text-[#a1a6bc] mt-1">Max 5 photos allowed</span>
              </div>
              {images.length > 0 && (
                <p className="text-xs text-[#7b819a] mt-2">{images.length} photo(s) selected</p>
              )}
            </label>

            {/* Title Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#72788f] tracking-wide mb-2">TITLE</label>
              <input
                type="text"
                placeholder="e.g., Scientific Calculator FX-991EX"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e5e8f2] bg-white text-sm text-[#1f2433] placeholder:text-[#9aa0b5] focus:outline-none focus:border-[#4c40f5]"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-[#72788f] tracking-wide">DESCRIPTION</label>
                <button type="button" className="text-xs font-medium text-[#4c40f5] flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15 8l6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z" />
                  </svg>
                  AI Enhance
                </button>
              </div>
              <textarea
                placeholder="What condition is it in? Any specific usage rules?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e8f2] bg-white text-sm text-[#1f2433] placeholder:text-[#9aa0b5] focus:outline-none focus:border-[#4c40f5] resize-none"
              />
            </div>

            {/* Price and Category */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#72788f] tracking-wide mb-2">PRICE / DAY (₹)</label>
                <input
                  type="number"
                  placeholder="20"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e8f2] bg-white text-sm text-[#1f2433] placeholder:text-[#9aa0b5] focus:outline-none focus:border-[#4c40f5]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#72788f] tracking-wide mb-2">CATEGORY</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e8f2] bg-white text-sm text-[#1f2433] focus:outline-none focus:border-[#4c40f5]"
                >
                  <option value="">Select</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Meeting Location */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#72788f] tracking-wide mb-2">MEETING LOCATION</label>
              <input
                type="text"
                placeholder="e.g., Hostel Block D, Main Gate"
                value={formData.meeting_location}
                onChange={(e) => setFormData({ ...formData, meeting_location: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#e5e8f2] bg-white text-sm text-[#1f2433] placeholder:text-[#9aa0b5] focus:outline-none focus:border-[#4c40f5]"
              />
            </div>

            {/* Fee Disclosure */}
            <div className="p-4 rounded-xl bg-[#fff9ed] border border-[#ffedc9] flex items-start gap-3">
              <svg className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#dc7609] mb-1">Fee Disclosure</p>
                <p className="text-xs text-[#a16207]">A platform fee of ₹30 applies per item when you publish a listing.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-center text-sm text-[#d14343] bg-[#fdeeee] border border-[#f9d2d2] rounded-lg py-2">{error}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full text-sm font-semibold text-white bg-[#4c40f5] shadow-[0_14px_35px_rgba(76,64,245,0.35)] hover:translate-y-[-1px] transition disabled:opacity-70"
          >
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
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

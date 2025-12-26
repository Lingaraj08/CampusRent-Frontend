'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Simple heuristic to check if it's an email
    const isEmail = identifier.includes('@')

    try {
      let error;
      if (isEmail) {
        const { error: emailError } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        })
        error = emailError
      } else {
        // Attempt phone login if it's not an email
        const { error: phoneError } = await supabase.auth.signInWithPassword({
           phone: identifier,
           password
        })
        error = phoneError
      }

      if (error) throw error
      
      router.push('/') // Redirect to dashboard/home
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-[0_18px_55px_rgba(76,64,245,0.16)] overflow-hidden">
          <div className="flex flex-col items-center text-center px-10 pt-12 pb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#6251f8] to-[#4738db] shadow-[0_12px_30px_rgba(76,64,245,0.35)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3L3 7.5L12 12L21 7.5L12 3Z" fill="white" opacity="0.95" />
                <path d="M5 10V15C5 15.53 5.21 16.04 5.59 16.41C6 16.83 6.5 17 7 17L12 19L17 17C17.5 17 18 16.83 18.41 16.41C18.79 16.04 19 15.53 19 15V10L12 13.5L5 10Z" fill="white" />
              </svg>
            </div>
            <h1 className="mt-5 text-3xl font-semibold text-[#1c1c1e]">CampusRent</h1>
            <p className="mt-2 text-sm tracking-[0.14em] uppercase text-[#7d8199]">Exclusive Student Portal</p>
          </div>

          <form className="px-10 pb-10 space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f7f8fb] border border-transparent focus-within:border-[#4c40f5] transition" htmlFor="identifier">
                <svg className="h-5 w-5 text-[#8a90a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6H20C21.1 6 22 6.9 22 8V16C22 17.1 21.1 18 20 18H4C2.9 18 2 17.1 2 16V8C2 6.9 2.9 6 4 6Z" />
                  <path d="M22 8L12 13L2 8" />
                </svg>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  className="w-full bg-transparent outline-none text-sm text-[#1f2433] placeholder:text-[#9aa0b5]"
                  placeholder="College Email (@xyz.edu.in)"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </label>

              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f7f8fb] border border-transparent focus-within:border-[#4c40f5] transition" htmlFor="password">
                <svg className="h-5 w-5 text-[#8a90a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="9" rx="2" ry="2" />
                  <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full bg-transparent outline-none text-sm text-[#1f2433] placeholder:text-[#9aa0b5]"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>

            {error && (
              <div className="text-center text-sm text-[#d14343] bg-[#fdeeee] border border-[#f9d2d2] rounded-lg py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#4c40f5] shadow-[0_14px_35px_rgba(76,64,245,0.35)] hover:translate-y-[-1px] transition disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#9ba1b6] pt-2">
              <div className="flex-1 border-t border-[#e4e6ed]" />
              <span>Institutional Access</span>
              <div className="flex-1 border-t border-[#e4e6ed]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#e1e4ec] bg-white text-sm font-medium text-[#1f2433] shadow-sm hover:border-[#d7daea] transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.7 18.27 13.46 18.69 12 18.69C9.14 18.69 6.7 16.76 5.83 14.17H2.18V17.02C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
                <path d="M5.83 14.17C5.61 13.51 5.48 12.81 5.48 12.1C5.48 11.39 5.61 10.69 5.83 10.03V7.18H2.18C1.43 8.64 1 10.31 1 12.1C1 13.89 1.43 15.56 2.18 17.02L5.83 14.17Z" fill="#FBBC05" />
                <path d="M12 5.52C13.62 5.52 15.06 6.08 16.22 7.17L19.36 4.03C17.45 2.22 14.97 1.2 12 1.2C7.7 1.2 3.99 3.67 2.18 7.18L5.83 10.03C6.7 7.44 9.14 5.52 12 5.52Z" fill="#EA4335" />
              </svg>
              Login with College Google ID
            </button>

            <div className="text-center text-sm pt-2">
              <Link href="/auth/signup" className="text-[#4c40f5] font-semibold hover:underline">
                New student? Join community
              </Link>
            </div>

            <p className="text-center text-[11px] text-[#a1a6bc] tracking-wide mt-2 leading-relaxed">
              Secure P2P Protocol.<br />
              Identity verification via Gemini AI follows.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    clgEmail: '',
  })
  
  const [userImage, setUserImage] = useState<File | null>(null)
  const [idImage, setIdImage] = useState<File | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'id') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'user') setUserImage(e.target.files[0])
      else setIdImage(e.target.files[0])
    }
  }

  // Mock function for face matching
  const verifyFaceMatch = async (img1: File, img2: File): Promise<boolean> => {
    // NOTE: In a production environment, you should use a backend service 
    // (like AWS Rekognition, Azure Face API) or a library like face-api.js 
    // to perform actual face comparison.
    console.log("Verifying face match between", img1.name, "and", img2.name)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulating a successful match for demonstration purposes.
        // Requirement: Match > 50-60%
        const matchScore = 0.85; // 85%
        console.log(`Face match score: ${matchScore * 100}%`);
        resolve(matchScore > 0.6); 
      }, 1500)
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Validate all fields are present
      if (!formData.username || !formData.email || !formData.phone || !formData.password || !formData.clgEmail || !userImage || !idImage) {
        throw new Error("All fields are mandatory.")
      }

      if (!formData.clgEmail.endsWith('.edu.in')) {
        throw new Error("College email must end with .edu.in")
      }

      // 2. Verify Face Match
      const isMatch = await verifyFaceMatch(userImage, idImage)
      if (!isMatch) {
        throw new Error("Face verification failed. Your photo does not match the ID proof (Match < 50%).")
      }

      // 3. Upload Images to Supabase Storage
      // Upload User Image
      const userImageExt = userImage.name.split('.').pop()
      const userImageName = `signup_${Date.now()}_user.${userImageExt}`
      const { data: userData, error: userError } = await supabase.storage
        .from('kyc-files')
        .upload(userImageName, userImage)
      
      if (userError) throw new Error(`User image upload failed: ${userError.message}`)

      // Upload ID Image
      const idImageExt = idImage.name.split('.').pop()
      const idImageName = `signup_${Date.now()}_id.${idImageExt}`
      const { data: idData, error: idError } = await supabase.storage
        .from('kyc-files')
        .upload(idImageName, idImage)

      if (idError) throw new Error(`ID image upload failed: ${idError.message}`)

      // Create KYC verification record
      const { error: insertError } = await supabase
        .from("kyc_verifications")
        .insert({
          user_id: formData.email, // We'll use email as temp identifier; it will be replaced after signup
          selfie_url: userData.path,
          govt_id_url: idData.path
        })

      if (insertError) throw new Error(`KYC insert failed: ${insertError.message}`)

      // Sign up with Supabase
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            phone: formData.phone,
            clg_email: formData.clgEmail
          }
        }
      })

      if (authError) throw authError

      alert("Signup successful! Continue with Identity Gateway (KYC).")
      router.push('/auth/kyc')

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
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

          <form className="px-10 pb-10 space-y-5" onSubmit={handleSignup}>
            <div className="space-y-4">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f7f8fb] border border-transparent focus-within:border-[#4c40f5] transition" htmlFor="username">
                <svg className="h-5 w-5 text-[#8a90a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" />
                  <path d="M5 20C5.35 16.67 8.35 14 12 14C15.65 14 18.65 16.67 19 20" />
                </svg>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full bg-transparent outline-none text-sm text-[#1f2433] placeholder:text-[#9aa0b5]"
                  placeholder="Full Name"
                  value={formData.username}
                  onChange={handleChange}
                />
              </label>

              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f7f8fb] border border-transparent focus-within:border-[#4c40f5] transition" htmlFor="email">
                <svg className="h-5 w-5 text-[#8a90a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6H20C21.1 6 22 6.9 22 8V16C22 17.1 21.1 18 20 18H4C2.9 18 2 17.1 2 16V8C2 6.9 2.9 6 4 6Z" />
                  <path d="M22 8L12 13L2 8" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full bg-transparent outline-none text-sm text-[#1f2433] placeholder:text-[#9aa0b5]"
                  placeholder="Primary Email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </label>

              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f7f8fb] border border-transparent focus-within:border-[#4c40f5] transition" htmlFor="clgEmail">
                <svg className="h-5 w-5 text-[#8a90a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6H20C21.1 6 22 6.9 22 8V16C22 17.1 21.1 18 20 18H4C2.9 18 2 17.1 2 16V8C2 6.9 2.9 6 4 6Z" />
                  <path d="M22 8L12 13L2 8" />
                </svg>
                <input
                  id="clgEmail"
                  name="clgEmail"
                  type="email"
                  required
                  className="w-full bg-transparent outline-none text-sm text-[#1f2433] placeholder:text-[#9aa0b5]"
                  placeholder="College Email (@xyz.edu.in)"
                  value={formData.clgEmail}
                  onChange={handleChange}
                />
              </label>

              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f7f8fb] border border-transparent focus-within:border-[#4c40f5] transition" htmlFor="phone">
                <svg className="h-5 w-5 text-[#8a90a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92V19C22 20.1 21.1 21 20 21C10.61 21 3 13.39 3 4C3 2.9 3.9 2 5 2H7.09C7.56 2 7.97 2.32 8.09 2.77L9.37 7.54C9.47 7.91 9.35 8.3 9.07 8.57L7.21 10.42C8.78 13.32 11.18 15.72 14.08 17.29L15.93 15.44C16.2 15.17 16.59 15.05 16.96 15.15L21.73 16.43C22.19 16.56 22.51 16.97 22 16.92Z" />
                </svg>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="w-full bg-transparent outline-none text-sm text-[#1f2433] placeholder:text-[#9aa0b5]"
                  placeholder="Mobile Number"
                  value={formData.phone}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-[#f7f8fb] border border-dashed border-[#d9dcea] text-sm text-[#1f2433]">
                  <span className="text-xs uppercase tracking-[0.12em] text-[#8a90a8]">Upload Selfie</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    className="text-[13px] text-[#5f6684] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f0f1ff] file:text-[#4c40f5] hover:file:bg-[#e6e8ff]"
                    onChange={(e) => handleFileChange(e, 'user')}
                  />
                </div>
                <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-[#f7f8fb] border border-dashed border-[#d9dcea] text-sm text-[#1f2433]">
                  <span className="text-xs uppercase tracking-[0.12em] text-[#8a90a8]">Upload College / Govt ID</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    className="text-[13px] text-[#5f6684] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f0f1ff] file:text-[#4c40f5] hover:file:bg-[#e6e8ff]"
                    onChange={(e) => handleFileChange(e, 'id')}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-center text-sm text-[#d14343] bg-[#fdeeee] border border-[#f9d2d2] rounded-lg py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#4c40f5] shadow-[0_14px_35px_rgba(76,64,245,0.35)] hover:translate-y-[-1px] transition disabled:opacity-70"
            >
              {loading ? 'Creating Account...' : 'Register Student'}
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#9ba1b6] pt-2">
              <div className="flex-1 border-t border-[#e4e6ed]" />
              <span>Institutional Access</span>
              <div className="flex-1 border-t border-[#e4e6ed]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
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
              <Link href="/auth/login" className="text-[#4c40f5] font-semibold hover:underline">
                Existing member? Sign in
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

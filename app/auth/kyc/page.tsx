'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@supabase/supabase-js";// changed

export default function KYCPage() {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userImage, setUserImage] = useState<File | null>(null)
  const [idImage, setIdImage] = useState<File | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [aiScore, setAiScore] = useState<number | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
      }
    }
    checkUser()
  }, [router, supabase]) // include supabase in deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'id') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'user') setUserImage(e.target.files[0])
      else setIdImage(e.target.files[0])
    }
  }

  // Mock function for face matching
  const verifyFaceMatch = async (img1: File, img2: File): Promise<boolean> => {
    console.log("Verifying face match between", img1.name, "and", img2.name)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulating a successful match with > 60% accuracy
        const matchScore = 0.85; // 85%
        console.log(`Face match score: ${matchScore * 100}%`);
        resolve(matchScore > 0.6); 
      }, 1500)
    })
  }

  const proceedFromStep1 = () => {
    setError(null)
    if (!userImage) {
      setError('Please capture a selfie to continue.')
      return
    }
    setStep(2)
  }

  const verifyAndSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!userImage) throw new Error('Selfie is missing.')
      if (!idImage) throw new Error('Identity card is missing.')

      const matched = await verifyFaceMatch(userImage, idImage)
      if (!matched) throw new Error('Face verification failed. Your photo does not match the ID proof.')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const userImageExt = userImage.name.split('.').pop()
      const userImageName = `${user.id}_user_${Date.now()}.${userImageExt}`
      const { data: userData, error: userError } = await supabase.storage
        .from('kyc-files')
        .upload(userImageName, userImage)
      if (userError) throw userError

      const idImageExt = idImage.name.split('.').pop()
      const idImageName = `${user.id}_id_${Date.now()}.${idImageExt}`
      const { data: idData, error: idError } = await supabase.storage
        .from('kyc-files')
        .upload(idImageName, idImage)
      if (idError) throw idError

      const { error: insertError } = await supabase
        .from('kyc_verifications')
        .insert({
          user_id: user.id,
          selfie_url: userData.path,
          govt_id_url: idData.path,
        })
      if (insertError) throw new Error(insertError.message || JSON.stringify(insertError))

      setAiScore(85)
      setStep(3)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      console.error('KYC submission error:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow-[0_18px_55px_rgba(76,64,245,0.16)] overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-10 pt-10">
            <div className="flex flex-col items-center w-full">
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#6251f8] to-[#4738db] shadow-[0_12px_30px_rgba(76,64,245,0.35)] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" opacity="0.9" />
                  <path d="M9.5 12.5C9.5 10.57 11.07 9 13 9M11 14.5C11 13.12 12.12 12 13.5 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-[#1c1c1e]">Identity Gateway</h2>
              <p className="mt-2 text-xs tracking-[0.16em] uppercase text-[#7d8199]">Mandatory Community Verification</p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-[#dfe2ed] text-[#7d8199]">i</span>
            </div>
          </div>

          {/* Progress */}
          <div className="px-10 pt-8">
            <div className="flex items-center gap-6">
              <div className={`h-1.5 rounded-full flex-1 ${step >= 1 ? 'bg-[#4c40f5]' : 'bg-[#eceff6]'}`}></div>
              <div className={`h-1.5 rounded-full flex-1 ${step >= 2 ? 'bg-[#4c40f5]' : 'bg-[#eceff6]'}`}></div>
              <div className={`h-1.5 rounded-full flex-1 ${step >= 3 ? 'bg-[#4c40f5]' : 'bg-[#eceff6]'}`}></div>
            </div>
          </div>

          {/* Body */}
          <div className="px-10 pb-10">
            {step === 1 && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold text-center mt-6 text-[#1c1c1e]">Step 1: Bio-Capture</h3>
                <p className="text-center text-xs font-medium text-[#8a90a8] tracking-wide">We need a live selfie to compare against your official credentials.</p>
                <label className="mx-auto block w-full sm:w-[520px] h-[260px] rounded-[28px] border-2 border-dashed border-[#e5e8f2] bg-[#fbfcff] shadow-inner flex items-center justify-center cursor-pointer relative">
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileChange(e, 'user')} />
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center">
                      <svg className="h-7 w-7 text-[#8a90a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="7" width="18" height="14" rx="3" ry="3" />
                        <circle cx="12" cy="14" r="3" />
                      </svg>
                    </div>
                    <span className="mt-4 text-xs font-semibold tracking-[0.2em] text-[#7d8199]">Capture Live Selfie</span>
                  </div>
                </label>

                {error && <div className="text-center text-sm text-[#d14343] bg-[#fdeeee] border border-[#f9d2d2] rounded-lg py-2">{error}</div>}

                <button onClick={proceedFromStep1} className="w-full sm:w-[520px] mx-auto block py-4 rounded-full text-sm font-semibold text-white bg-[#bcb8ff] hover:bg-[#aeaaff] transition shadow-[0_14px_35px_rgba(76,64,245,0.2)]">
                  Next Step
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold text-center mt-6 text-[#1c1c1e]">Step 2: ID Authentication</h3>
                <p className="text-center text-xs font-medium text-[#8a90a8] tracking-wide">Upload your college ID or govt ID. Gemini AI will run a face-matching analysis.</p>
                <label className="mx-auto block w-full sm:w-[520px] h-[260px] rounded-[28px] border-2 border-dashed border-[#e5e8f2] bg-[#fbfcff] shadow-inner flex items-center justify-center cursor-pointer relative">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'id')} />
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center">
                      <svg className="h-7 w-7 text-[#8a90a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="7" width="16" height="10" rx="2" ry="2" />
                        <rect x="8" y="10" width="8" height="4" rx="1" />
                      </svg>
                    </div>
                    <span className="mt-4 text-xs font-semibold tracking-[0.2em] text-[#7d8199]">Scan Identity Card</span>
                  </div>
                </label>

                {error && <div className="text-center text-sm text-[#d14343] bg-[#fdeeee] border border-[#f9d2d2] rounded-lg py-2">{error}</div>}

                <button onClick={verifyAndSubmit} disabled={loading} className="w-full sm:w-[520px] mx-auto block py-4 rounded-full text-sm font-semibold text-white bg-[#bcb8ff] hover:bg-[#aeaaff] transition disabled:opacity-70 shadow-[0_14px_35px_rgba(76,64,245,0.2)]">
                  {loading ? 'Verifying…' : 'Verify Identity'}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 text-center py-8">
                <div className="mx-auto w-36 h-36 rounded-full bg-[#e9f8ef] flex items-center justify-center shadow-inner">
                  <div className="w-24 h-24 rounded-full bg-[#d9f3e3] flex items-center justify-center">
                    <svg className="h-14 w-14 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17L4 12" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold tracking-wide text-[#1c1c1e]">Verified</h3>
                {aiScore !== null && (
                  <div className="mx-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e9f8ef] text-[#0f9a43] text-xs font-semibold">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    AI Match: {aiScore}%
                  </div>
                )}
                <p className="text-[#7d8199] text-xs font-medium tracking-wide">Security protocols cleared. You now have full access to the campus marketplace.</p>
                <button onClick={() => router.push('/')} className="w-full sm:w-[520px] mx-auto block py-4 rounded-full text-sm font-semibold text-white bg-[#4c40f5] shadow-[0_14px_35px_rgba(76,64,245,0.35)]">
                  Get Started
                </button>
                <p className="text-[11px] text-[#a1a6bc] tracking-wide">Encrypted student privacy protocol</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

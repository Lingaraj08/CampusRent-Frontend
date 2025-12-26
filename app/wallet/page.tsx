'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWallet, topUpWallet, withdrawWallet } from '@/lib/api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function WalletPage() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [earnings, setEarnings] = useState(0)
  const [upiLinked, setUpiLinked] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [upiId, setUpiId] = useState('')
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    const loadWallet = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const access = sessionData?.session?.access_token || ''
      setToken(access)
      if (!access) return
      try {
        const summary = await getWallet(access)
        if (typeof summary.balance === 'number') setBalance(summary.balance)
        if (typeof summary.earnings === 'number') setEarnings(summary.earnings)
        if (summary.upi_linked) setUpiLinked(true)
      } catch (e) {
        console.warn('Wallet fetch failed', e)
      }
    }
    loadWallet()
  }, [])

  const handleTopUp = () => {
    setShowTopUpModal(true)
  }

  const processTopUp = () => {
    const amount = parseFloat(topUpAmount)
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'CampusRent',
      description: 'Wallet Top-up',
      handler: function (response: any) {
        alert('Payment successful! Payment ID: ' + response.razorpay_payment_id)
        setBalance((prev) => prev + amount)
        setTopUpAmount('')
        setShowTopUpModal(false)
        if (token) {
          topUpWallet(amount, token, response.razorpay_payment_id).catch((e) => console.warn('Top-up API failed', e))
        }
      },
      prefill: {
        name: 'Student',
        email: 'student@college.edu.in',
      },
      theme: {
        color: '#4c40f5',
      },
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }

  const handleWithdraw = () => {
    if (!upiLinked) {
      // Show UPI setup modal
      setShowWithdrawModal(true)
      return
    }

    // Process withdrawal
    const amount = parseFloat(withdrawAmount || '0')
    if (token) {
      withdrawWallet(amount, token, upiId || upiId).catch((e) => console.warn('Withdraw API failed', e))
    }
    alert(`Withdrawal request submitted for ₹${withdrawAmount}`)
    setEarnings((prev) => prev - amount)
    setWithdrawAmount('')
    setShowWithdrawModal(false)
  }

  const connectUpi = () => {
    if (!upiId) {
      alert('Please enter a valid UPI ID')
      return
    }
    setUpiLinked(true)
    alert('UPI ID linked successfully!')
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#2563eb]">Wallet</h1>
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
        <h2 className="text-xl font-extrabold text-[#1c1c1e] mb-4">Wallet & Payouts</h2>

        {/* Available Balance Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#eef2ff] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#4c40f5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="17" cy="12" r="1.5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-[#a1a6bc] tracking-wide">AVAILABLE FOR SPENDING</p>
                <p className="text-3xl font-bold text-[#1c1c1e]">₹{balance}</p>
              </div>
            </div>
            <button
              onClick={handleTopUp}
              className="px-6 py-2.5 rounded-full bg-[#4c40f5] text-white text-sm font-semibold shadow-lg hover:bg-[#3d34d1] transition"
            >
              Top Up
            </button>
          </div>
        </div>

        {/* Earnings Card */}
        <div className="bg-gradient-to-br from-[#5346f8] to-[#4c40f5] rounded-2xl shadow-lg p-6 mb-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium opacity-80 tracking-wide">MY RENTAL EARNINGS</p>
                  <p className="text-3xl font-bold">₹{earnings}</p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-6 py-2.5 rounded-full bg-white text-[#4c40f5] text-sm font-semibold shadow-lg hover:bg-opacity-90 transition"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* UPI Setup */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#fff9ed] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#f59e0b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15 8l6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#72788f]">Bank Payout (UPI)</p>
                <p className={`text-xs ${upiLinked ? 'text-[#16a34a]' : 'text-[#f59e0b]'} font-medium`}>
                  {upiLinked ? 'Linked' : 'Not Linked'}
                </p>
              </div>
            </div>
            {!upiLinked && (
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-4 py-2 rounded-full text-sm font-semibold text-[#4c40f5] hover:bg-[#eef2ff] transition"
              >
                Setup
              </button>
            )}
          </div>
        </div>

        {/* Warning Banner */}
        {!upiLinked && (
          <div className="p-4 rounded-xl bg-[#fff9ed] border border-[#ffedc9] flex items-start gap-3 mb-4">
            <svg className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-xs text-[#a16207] font-medium">Setup your UPI ID to receive payouts from your rentals.</p>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-[#4c40f5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <h3 className="text-sm font-semibold text-[#1c1c1e]">Recent Activity</h3>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-sm text-[#a1a6bc]">No recent transactions</p>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f6f7fb] flex items-center justify-center text-[#72788f] hover:bg-[#e5e8f2] transition"
            >
              ✕
            </button>

            <h3 className="text-xl font-extrabold text-[#1c1c1e] mb-4">Withdraw Earnings</h3>

            {!upiLinked ? (
              <div>
                <div className="p-4 rounded-xl bg-[#fff9ed] border border-[#ffedc9] mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-[#dc7609] mb-1">Setup UPI ID First</p>
                      <p className="text-xs text-[#a16207]">We need a payout destination to send your money.</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#72788f] tracking-wide mb-2">UPI ID</label>
                  <input
                    type="text"
                    placeholder="yourname@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e8f2] bg-white text-sm text-[#1f2433] placeholder:text-[#9aa0b5] focus:outline-none focus:border-[#4c40f5]"
                  />
                </div>

                <button
                  onClick={connectUpi}
                  className="w-full py-3.5 rounded-full bg-[#f59e0b] text-white text-sm font-semibold shadow-lg hover:bg-[#ea8600] transition"
                >
                  Connect UPI
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#72788f] tracking-wide mb-2 text-center">AMOUNT TO WITHDRAW (₹)</label>
                  <div className="flex items-center justify-center mb-2">
                    <input
                      type="number"
                      placeholder="0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-32 text-4xl font-bold text-center text-[#1c1c1e] bg-transparent border-b-2 border-[#4c40f5] focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-center text-[#7b819a]">Available for withdrawal: ₹{earnings}</p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) > earnings}
                  className="w-full py-3.5 rounded-full bg-[#bcb8ff] text-white text-sm font-semibold shadow-lg hover:bg-[#aeaaff] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15 8l6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z" />
                  </svg>
                  Request Withdrawal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f6f7fb] flex items-center justify-center text-[#72788f] hover:bg-[#e5e8f2] transition"
            >
              ✕
            </button>

            <h3 className="text-xl font-extrabold text-[#1c1c1e] mb-4">Top Up Wallet</h3>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#72788f] tracking-wide mb-2 text-center">AMOUNT TO ADD (₹)</label>
              <div className="flex items-center justify-center mb-2">
                <span className="text-4xl font-bold text-[#7b819a] mr-2">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-40 text-4xl font-bold text-center text-[#1c1c1e] bg-transparent border-b-2 border-[#4c40f5] focus:outline-none"
                />
              </div>
              <p className="text-xs text-center text-[#7b819a]">Current balance: ₹{balance}</p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[100, 250, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt.toString())}
                  className="py-2 px-3 rounded-lg border border-[#e5e8f2] text-sm font-semibold text-[#4c40f5] hover:bg-[#eef2ff] transition"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={processTopUp}
              disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
              className="w-full py-3.5 rounded-full bg-[#4c40f5] text-white text-sm font-semibold shadow-lg hover:bg-[#3d34d1] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      )}

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
            <Link href="/wallet" className="flex flex-col items-center justify-center text-[#2563eb]">
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

# Razorpay Integration Setup

## Quick Start

1. **Get Razorpay API Keys**
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Navigate to Settings → API Keys
   - Generate Test/Live API keys

2. **Add to Environment Variables**
   Update `.env.local`:
   ```bash
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   ```

3. **Features Implemented**
   - **Top Up**: Add money to wallet using Razorpay payment gateway
   - **Withdraw**: Request withdrawal to UPI ID (requires UPI setup first)
   - UPI linking for payout destination

## Test Mode

For testing, use Razorpay's test credentials:
- Test Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

## Pages Created

- `/search` - Search page with category filters
- `/my-gear` - Dashboard with Inventory & Orders tabs
- `/add-item` - List new items with photo upload (max 5 photos)
- `/wallet` - Wallet with Top Up (Razorpay) and Withdraw (UPI)
- `/profile` - User profile with sign out

## Navigation

All pages include a consistent 5-tab bottom navigation:
1. Explore (Home)
2. Search
3. My Gear
4. Wallet
5. Profile

## Floating + Button

The blue circular + button appears on My Gear dashboard and routes to `/add-item` for listing new items.

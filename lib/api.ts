const API = process.env.NEXT_PUBLIC_API_URL;

const json = (res: Response) => {
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

export async function healthCheck() {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/`, { cache: 'no-store' });
  return json(res);
}

export async function getListings() {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/listings`, { cache: 'no-store' });
  return json(res);
}

export async function login(data: { email: string; password: string }) {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return json(res);
}

interface BookingPayload { [key: string]: unknown }

export async function createBooking(payload: BookingPayload, token: string) {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return json(res);
}

export async function getWallet(token: string) {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/wallet`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return json(res);
}

export async function topUpWallet(amount: number, token: string, paymentId?: string) {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/wallet/topup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, payment_id: paymentId }),
  });
  return json(res);
}

export async function withdrawWallet(amount: number, token: string, upi: string) {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/wallet/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, upi }),
  });
  return json(res);
}

export async function getMessages(listingId: number | string, token: string) {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/messages?listing_id=${listingId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return json(res);
}

export async function sendMessage(listingId: number | string, content: string, token: string) {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ listing_id: listingId, content }),
  });
  return json(res);
}

export function buildWsUrl(path = '/ws') {
  const wsEnv = process.env.NEXT_PUBLIC_WS_URL;
  const base = wsEnv || API || '';
  if (!base) return '';
  if (base.startsWith('ws')) return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  return `${base.replace('http', 'ws')}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function getNotifications(token: string) {
  if (!API) throw new Error('API url missing');
  const res = await fetch(`${API}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return json(res);
}

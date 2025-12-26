const API = process.env.NEXT_PUBLIC_API_URL;

export async function getListings() {
  const res = await fetch(`${API}/listings`, {
    cache: "no-store",
  });
  return res.json();
}

export async function login(data: { email: string; password: string }) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

interface BookingPayload {
  [key: string]: unknown;
}

export async function createBooking(payload: BookingPayload, token: string) {
  const res = await fetch(`${API}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

import { apiFetch, setToken, clearToken } from './client'

const BASE = ''

export async function register(email, password) {
  const data = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  })
  if (!res.ok) throw new Error('Invalid email or password')
  const data = await res.json()
  setToken(data.access_token)
  return data
}

export function logout() {
  clearToken()
  window.location.href = '/login'
}

export async function getMe() {
  return apiFetch('/api/auth/me')
}

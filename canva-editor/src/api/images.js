import { apiFetch } from './client'

const BASE = ''

export const listImages = () =>
  apiFetch('/api/images')

export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${BASE}/api/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export const getImage = (id) =>
  apiFetch(`/api/images/${id}`)

export const deleteImage = (id) =>
  apiFetch(`/api/images/${id}`, { method: 'DELETE' })

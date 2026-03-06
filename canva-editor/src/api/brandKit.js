import { apiFetch } from './client'

export const getBrandKit = () =>
  apiFetch('/api/brand-kit')

export const saveBrandKit = (data) =>
  apiFetch('/api/brand-kit', {
    method: 'PUT',
    body: JSON.stringify(data),
  })

import { apiFetch } from './client'

export const listProjects = () =>
  apiFetch('/api/projects')

export const getProject = (id) =>
  apiFetch(`/api/projects/${id}`)

export const createProject = (data) =>
  apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateProject = (id, data) =>
  apiFetch(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deleteProject = (id) =>
  apiFetch(`/api/projects/${id}`, { method: 'DELETE' })

export const getAutosave = () =>
  apiFetch('/api/projects/autosave/current')

export const putAutosave = (data) =>
  apiFetch('/api/projects/autosave/current', {
    method: 'PUT',
    body: JSON.stringify(data),
  })

import { apiFetch } from './client';

export const listTemplates = () =>
  apiFetch('/api/templates');

export const deleteTemplate = (id) =>
  apiFetch(`/api/templates/${id}`, { method: 'DELETE' });

export async function uploadPptxTemplate(file, name = '', isGlobal = false) {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name || file.name.replace('.pptx', ''));
  formData.append('is_global', String(isGlobal));

  const res = await fetch('/api/templates/upload-pptx', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export const listAdminUsers = () =>
  apiFetch('/api/templates/admin/users');

export const promoteToAdmin = (email) =>
  apiFetch('/api/templates/admin/promote', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

/**
 * Image storage - now uses API (MinIO) instead of IndexedDB.
 * Re-exports from api/images for components that import from here.
 */
import { uploadImage, listImages, deleteImage, getImage as apiGetImage } from '../api/images';

export { uploadImage, listImages, deleteImage };

export async function getImage(id) {
  const img = await apiGetImage(id);
  return img?.url ?? null;
}

export async function saveImage(id, src, name, type) {
  // Legacy: convert data URL to file and upload. Used by StockPhotosSection, FrameToolbar.
  if (typeof src === 'string' && (src.startsWith('data:') || src.startsWith('blob:'))) {
    const res = await fetch(src);
    const blob = await res.blob();
    const file = new File([blob], name || 'image.png', { type: type || blob.type || 'image/png' });
    return uploadImage(file);
  }
  throw new Error('saveImage requires data URL; use uploadImage for file uploads');
}

export async function getAllImages() {
  const images = await listImages();
  return images.map((i) => ({
    id: i.id,
    src: i.url,
    name: i.name,
    type: i.type,
    savedAt: i.created_at ? new Date(i.created_at).getTime() : 0,
  }));
}

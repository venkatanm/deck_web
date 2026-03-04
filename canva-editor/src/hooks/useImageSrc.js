import { useState, useEffect } from "react";
import { getImage } from "../utils/imageStorage";

const imageCache = new Map();

export function useImageSrc(imageId) {
  const [src, setSrc] = useState(imageId ? imageCache.get(imageId) || null : null);

  useEffect(() => {
    if (!imageId) return;
    if (imageCache.has(imageId)) {
      setSrc(imageCache.get(imageId));
      return;
    }
    getImage(imageId).then((data) => {
      const url = typeof data === "string" ? data : data?.src;
      if (url) {
        imageCache.set(imageId, url);
        setSrc(url);
      }
    });
  }, [imageId]);

  return src;
}

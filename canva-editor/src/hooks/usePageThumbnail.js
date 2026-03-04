import { useState, useEffect, useRef } from "react";
import { pageToDataURL } from "../utils/exportCanvas";

export function usePageThumbnail(page, canvasSize, deps = []) {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const dataURL = await pageToDataURL(page, canvasSize, 0.2, "image/jpeg");
        setThumbnail(dataURL);
      } catch (e) {
        console.error("Thumbnail error", e);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timerRef.current);
  }, [page?.id, canvasSize?.width, canvasSize?.height, ...deps]);

  return { thumbnail, loading };
}

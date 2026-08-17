import { useCallback, useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * عارض صور عام: أي صورة في المنصة تُفتح بالحجم الكامل عند الضغط عليها.
 * لاستثناء صورة: أضف data-no-zoom على عنصر <img>.
 */
export function ImageLightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [zoom, setZoom] = useState(1);

  const close = useCallback(() => {
    setSrc(null);
    setZoom(1);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const img = target.closest("img") as HTMLImageElement | null;
      if (!img) return;
      if (img.dataset["noZoom"] !== undefined) return;
      if (img.closest("[data-no-zoom]")) return;
      if (img.closest("a[href], button, [role='button']")) return;
      if (!img.currentSrc && !img.src) return;
      // تجاهل الأيقونات الصغيرة جدًا
      if (img.naturalWidth && img.naturalWidth < 32) return;
      e.preventDefault();
      e.stopPropagation();
      setSrc(img.currentSrc || img.src);
      setAlt(img.alt || "");
      setZoom(1);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [src, close]);

  if (!src) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm animate-in fade-in"
      onClick={close}
    >
      <div
        className="flex items-center justify-between gap-2 p-2 sm:p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="truncate text-sm text-white/80 px-2">{alt}</div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/15"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            aria-label="تصغير"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/15"
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
            aria-label="تكبير"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <a href={src} target="_blank" rel="noreferrer">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/15" aria-label="فتح في تبويب جديد">
              <ExternalLink className="h-5 w-5" />
            </Button>
          </a>
          <a href={src} download target="_blank" rel="noreferrer">
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/15" aria-label="تحميل">
              <Download className="h-5 w-5" />
            </Button>
          </a>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/15"
            onClick={close}
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <img
          data-no-zoom
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          style={{ transform: `scale(${zoom})` }}
          className="max-h-[80vh] max-w-full object-contain transition-transform duration-150 rounded-md shadow-2xl"
        />
      </div>
    </div>
  );
}

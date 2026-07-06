import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: React.ReactNode;
};

export function SafeImage({
  src,
  alt = "",
  className,
  fallback,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground overflow-hidden",
          className
        )}
        aria-label={alt || undefined}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {fallback ?? <ImageOff className="h-5 w-5 opacity-60" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}

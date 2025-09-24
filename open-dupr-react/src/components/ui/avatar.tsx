import React, { useLayoutEffect, useRef, useState } from "react";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-base",
  xl: "w-24 h-24 text-4xl",
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = "lg",
  className = "",
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  const canShowImage = Boolean(src) && !imageError;

  useLayoutEffect(() => {
    // On src change, reset and detect if image is already cached to avoid flicker
    setImageError(false);
    if (
      imgRef.current &&
      imgRef.current.complete &&
      imgRef.current.naturalWidth > 0
    ) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  return (
    <div
      className={cn(
        sizeClasses[size],
        "relative rounded-full overflow-hidden",
        className,
        {
          "cursor-pointer": !!onClick,
        }
      )}
      onClick={onClick}
    >
      {/* Monogram placeholder - visible until image fully loads */}
      <div
        className={cn(
          "absolute inset-0 rounded-full flex items-center justify-center text-white font-semibold transition-opacity duration-200 ease-out",
          bgColor,
          {
            "opacity-0": canShowImage && isLoaded,
            "opacity-100": !(canShowImage && isLoaded),
          }
        )}
        aria-hidden={canShowImage && isLoaded}
      >
        {initials}
      </div>

      {/* Actual image - fades in when loaded */}
      {canShowImage && (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          ref={imgRef}
          className={cn(
            "absolute inset-0 h-full w-full rounded-full object-cover transition-all duration-200 ease-out",
            {
              "opacity-100 scale-100": isLoaded,
              "opacity-0 scale-105": !isLoaded,
            }
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

export default Avatar;

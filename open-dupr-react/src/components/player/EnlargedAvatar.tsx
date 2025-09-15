import React, { useLayoutEffect, useRef, useState } from "react";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";

interface EnlargedAvatarProps {
  src?: string;
  name: string;
}

const EnlargedAvatar: React.FC<EnlargedAvatarProps> = ({ src, name }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  const canShowImage = Boolean(src) && !imageError;

  useLayoutEffect(() => {
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
    <div className="relative w-[80vw] h-[80vw] max-w-[24rem] max-h-[24rem] rounded-lg overflow-hidden">
      <div
        className={`absolute inset-0 ${bgColor} flex items-center justify-center text-white font-bold text-8xl sm:text-9xl transition-opacity duration-300 ${
          canShowImage && isLoaded ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={canShowImage && isLoaded}
      >
        {initials}
      </div>

      {canShowImage && (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          ref={imgRef}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

export default EnlargedAvatar;

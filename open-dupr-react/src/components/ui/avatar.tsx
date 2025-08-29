import React, { useState, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset state when src changes
    setIsLoading(true);
    setImageError(false);
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const showMonogram = !src || imageError || isLoading;

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-full flex items-center justify-center relative overflow-hidden",
        className,
        {
          "cursor-pointer": !!onClick,
        }
      )}
      onClick={onClick}
    >
      {/* Monogram */}
      <div
        className={cn(
          "w-full h-full flex items-center justify-center text-white font-semibold",
          "transition-opacity duration-300",
          bgColor,
          { "opacity-100": showMonogram, "opacity-0": !showMonogram }
        )}
      >
        {initials}
      </div>

      {/* Image */}
      {src && (
        <img
          src={src}
          alt={name}
          className={cn(
            "absolute top-0 left-0 w-full h-full object-cover",
            "transition-opacity duration-300",
            { "opacity-100": !showMonogram, "opacity-0": showMonogram }
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default Avatar;

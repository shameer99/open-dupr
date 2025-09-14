import React, { useState } from "react";
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
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  const shouldShowInitials = !src || imageError;

  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-full flex items-center justify-center transition-transform duration-200",
        className,
        {
          "cursor-pointer hover:scale-105 active:scale-95": !!onClick,
        }
      )}
      onClick={onClick}
    >
      {shouldShowInitials ? (
        <div
          className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold`}
        >
          {initials}
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

export default Avatar;

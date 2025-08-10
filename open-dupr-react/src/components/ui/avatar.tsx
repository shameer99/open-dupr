import React, { useState } from "react";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
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
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  const shouldShowInitials = !src || imageError;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}
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

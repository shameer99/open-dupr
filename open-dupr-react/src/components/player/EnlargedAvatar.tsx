import React, { useState } from "react";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";

interface EnlargedAvatarProps {
  src?: string;
  name: string;
}

const EnlargedAvatar: React.FC<EnlargedAvatarProps> = ({ src, name }) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  const shouldShowInitials = !src || imageError;

  if (shouldShowInitials) {
    return (
      <div
        className={`w-96 h-96 ${bgColor} rounded-lg flex items-center justify-center text-white font-bold text-9xl`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="max-w-[80vw] max-h-[80vh] rounded-lg"
      onError={() => setImageError(true)}
    />
  );
};

export default EnlargedAvatar;

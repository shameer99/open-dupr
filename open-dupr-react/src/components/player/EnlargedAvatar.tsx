import React, { useState, useEffect } from "react";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";

interface EnlargedAvatarProps {
  src?: string;
  name:string;
}

const EnlargedAvatar: React.FC<EnlargedAvatarProps> = ({ src, name }) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    const image = new Image();
    image.src = src;
    image.onload = () => setStatus("loaded");
    image.onerror = () => setStatus("error");
  }, [src]);

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  if (status === "loading" || status === "error") {
    return (
      <div
        className={`w-[80vw] h-[80vw] max-w-[24rem] max-h-[24rem] ${bgColor} rounded-lg flex items-center justify-center text-white font-bold text-8xl sm:text-9xl`}
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
    />
  );
};

export default EnlargedAvatar;

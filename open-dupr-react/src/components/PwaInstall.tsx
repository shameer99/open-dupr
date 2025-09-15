import React from "react";
import "@khmyznikov/pwa-install";

const PwaInstall: React.FC = () => {
  return (React.createElement(
    "pwa-install",
    {
      id: "pwa-install",
      style: { display: "none" },
      "manual-apple": true,
      "manual-chrome": true,
      "use-local-storage": true,
      "manifest-url": "/manifest.webmanifest",
    } as unknown as Record<string, unknown>
  ) as unknown) as React.ReactElement;
};

export default PwaInstall;


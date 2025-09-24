import React from "react";
import { X, RefreshCw } from "lucide-react";

interface UpdateBannerProps {
  onReload: () => void;
  onDismiss: () => void;
}

const UpdateBanner: React.FC<UpdateBannerProps> = ({ onReload, onDismiss }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between max-w-screen-lg mx-auto">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            New OpenDUPR updates available! Reload to get the latest version.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReload}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Reload
          </button>
          <button
            onClick={onDismiss}
            className="text-white hover:text-blue-100 transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateBanner;
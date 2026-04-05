import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchButtonProps {
  onClick: () => void;
  isSearchOpen: boolean;
}

const SearchButton: React.FC<SearchButtonProps> = ({ onClick, isSearchOpen }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSecondaryText, setShowSecondaryText] = useState(false);

  useEffect(() => {
    let expandTimer: NodeJS.Timeout | undefined;

    if (isExpanded && !isSearchOpen) {
      expandTimer = setTimeout(() => {
        setShowSecondaryText(true);
      }, 300);
    } else {
      setShowSecondaryText(false);
    }

    return () => {
      if (expandTimer) {
        clearTimeout(expandTimer);
      }
    };
  }, [isExpanded, isSearchOpen]);

  useEffect(() => {
    const checkSpace = () => {
      setIsExpanded(window.innerWidth >= 768);
    };

    checkSpace();
    window.addEventListener('resize', checkSpace);
    return () => window.removeEventListener('resize', checkSpace);
  }, []);

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`
        relative transition-all duration-300 ease-out overflow-hidden
        ${isExpanded && !isSearchOpen ? 'px-6' : 'px-3'}
        ${isSearchOpen ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/25' : ''}
        hover:shadow-md hover:shadow-primary/20
        group
      `}
      style={{
        minWidth: isExpanded && !isSearchOpen ? '120px' : '44px',
        height: '44px',
      }}
    >
      <div className="flex items-center gap-2">
        <Search 
          className={`
            h-5 w-5 transition-all duration-300
            ${isSearchOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
          `} 
        />
        
        <div 
          className={`
            overflow-hidden transition-all duration-300 ease-out
            ${isExpanded && !isSearchOpen ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'}
          `}
        >
          <span className="text-sm font-medium whitespace-nowrap">
            {showSecondaryText ? (
              <span className="inline-block animate-slideDown">
                search
              </span>
            ) : (
              <span className="inline-block">
                search
              </span>
            )}
          </span>
        </div>
      </div>

      {showSecondaryText && (
        <div 
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground animate-slideUp"
        >
          profile, feed
        </div>
      )}
    </Button>
  );
};

export default SearchButton;
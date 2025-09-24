import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";
import { useHeader } from "@/lib/header-context";
import { Button } from "@/components/ui/button";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { Search, ArrowLeft } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { navigateWithTransition, navigateToProfile } from "@/lib/view-transitions";
import SearchOverlay from "@/components/ui/SearchOverlay";

const AppHeader: React.FC = () => {
  const {
    title,
    showBackButton,
    onBackClick,
    actionButton,
    avatarUrl,
    playerName,
    showHamburgerMenu,
  } = useHeader();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);


  const goToProfile = () => {
    setSearchOpen(false);
    navigateToProfile(navigate, "/profile");
  };

  const goToLogin = () => {
    navigateWithTransition(navigate, "/login");
  };

  return (
    <header className="sticky top-0 safe-area-inset-top z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
      <div className="container mx-auto relative flex h-14 items-center justify-between px-4">
        {showBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            className="shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <button
            type="button"
            onClick={goToProfile}
            className="flex items-center gap-1"
            aria-label="Go to profile"
          >
            <img
              src="/logo.png"
              alt="Open DUPR"
              className="block h-8 w-8 shrink-0"
            />
            {!title && (
              <span className="font-semibold tracking-tight text-lg leading-none max-[320px]:hidden">
                Open DUPR
              </span>
            )}
          </button>
        )}

        <div
          className={`pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center transition-opacity ${
            title ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-3">
            {(avatarUrl || playerName) && (
              <Avatar
                src={avatarUrl ?? undefined}
                name={playerName || ""}
                size="sm"
              />
            )}
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actionButton && (
            <Button
              variant="default"
              size="sm"
              onClick={actionButton.onClick}
              disabled={actionButton.disabled}
              className="text-sm"
            >
              {actionButton.text}
            </Button>
          )}

          {token ? (
            showHamburgerMenu && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className={`${searchOpen ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            )
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={goToLogin}
              className="text-sm"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
      <NavigationProgress />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default AppHeader;

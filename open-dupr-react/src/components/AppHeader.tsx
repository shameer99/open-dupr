import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";
import { useHeader } from "@/lib/header-context";
import { Button } from "@/components/ui/button";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { Search, ArrowLeft } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { navigateWithTransition, navigateToProfile } from "@/lib/view-transitions";

const AppHeader: React.FC = () => {
  const {
    title,
    showBackButton,
    onBackClick,
    actionButton,
    avatarUrl,
    playerName,
    showHamburgerMenu,
    isSearchOpen,
    setIsSearchOpen,
  } = useHeader();
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    // Close overlay on route changes via browser navigation if needed
    const onPop = () => setIsSearchOpen(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setIsSearchOpen]);

  const goToProfile = () => {
    navigateToProfile(navigate, "/profile");
  };

  // Reserved for future quick actions from header label

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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="search-glow"
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5" />
                </Button>
                <div className="hidden sm:block text-sm font-medium">
                  <div className="word-slider h-5 overflow-hidden">
                    <div className="word-slider-inner">
                      <span>Search</span>
                      <span>Profile</span>
                      <span>Feed</span>
                    </div>
                  </div>
                </div>
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
    </header>
  );
};

export default AppHeader;

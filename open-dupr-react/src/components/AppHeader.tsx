import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";
import { useHeader } from "@/lib/header-context";
import { Button } from "@/components/ui/button";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import {
  Menu,
  User,
  Search,
  Plus,
  LogOut,
  ArrowLeft,
  Info,
} from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";

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
  const { logout: authLogout, token } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const goToProfile = () => {
    setOpen(false);
    navigate("/profile");
  };

  const goToSearch = () => {
    setOpen(false);
    navigate("/search");
  };

  const goToRecordMatch = () => {
    setOpen(false);
    navigate("/record-match");
  };

  const goToAbout = () => {
    setOpen(false);
    navigate("/about");
  };

  const logout = () => {
    setOpen(false);
    authLogout();
    navigate("/login");
  };

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <header className="sticky top-safe z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
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
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all ${
            title ? "opacity-100" : "opacity-0 -translate-y-6"
          }`}
        >
          <div className="flex items-center gap-3">
            {(avatarUrl || playerName) && (
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                      playerName || ""
                    )}`}
                  >
                    {getInitials(playerName || "")}
                  </div>
                )}
              </div>
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
              <div className="relative" ref={menuRef}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOpen((v) => !v)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {open && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card shadow-md">
                    <button
                      type="button"
                      onClick={goToProfile}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <User className="h-5 w-5" />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={goToSearch}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <Search className="h-5 w-5" />
                      Search Players
                    </button>
                    <button
                      type="button"
                      onClick={goToRecordMatch}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Add Match
                    </button>
                    <button
                      type="button"
                      onClick={goToAbout}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <Info className="h-5 w-5" />
                      About Open DUPR
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-accent flex items-center gap-2"
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </button>
                  </div>
                )}
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

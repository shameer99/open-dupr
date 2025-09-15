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
  Moon,
  Sun,
  LayoutList,
} from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { useTheme } from "@/lib/useTheme";
import { navigateWithTransition } from "@/lib/view-transitions";

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
  const { setTheme, resolvedTheme } = useTheme();

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
    navigateWithTransition(navigate, "/profile");
  };

  const goToSearch = () => {
    setOpen(false);
    navigateWithTransition(navigate, "/search");
  };

  const goToRecordMatch = () => {
    setOpen(false);
    navigateWithTransition(navigate, "/record-match");
  };

  const goToAbout = () => {
    setOpen(false);
    navigateWithTransition(navigate, "/about");
  };

  const goToFeed = () => {
    setOpen(false);
    navigateWithTransition(navigate, "/feed");
  };

  const logout = () => {
    setOpen(false);
    authLogout();
    navigateWithTransition(navigate, "/login");
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
                    <div className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          className={`flex items-center justify-center rounded-md border p-2 hover:bg-accent cursor-pointer ${
                            resolvedTheme === "light" ? "ring-2 ring-ring" : ""
                          }`}
                          aria-label="Light theme"
                        >
                          <Sun className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          className={`flex items-center justify-center rounded-md border p-2 hover:bg-accent cursor-pointer ${
                            resolvedTheme === "dark" ? "ring-2 ring-ring" : ""
                          }`}
                          aria-label="Dark theme"
                        >
                          <Moon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={goToProfile}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-5 w-5" />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={goToFeed}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutList className="h-5 w-5" />
                      Feed
                    </button>
                    <button
                      type="button"
                      onClick={goToSearch}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2 cursor-pointer"
                    >
                      <Search className="h-5 w-5" />
                      Search Players
                    </button>
                    <button
                      type="button"
                      onClick={goToRecordMatch}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="h-5 w-5" />
                      Add Match
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={goToAbout}
                      className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-2 cursor-pointer"
                    >
                      <Info className="h-5 w-5" />
                      About Open DUPR
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-accent flex items-center gap-2 cursor-pointer"
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

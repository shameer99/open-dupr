import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";
import { useHeader } from "@/lib/header-context";
import { Button } from "@/components/ui/button";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { Menu } from "lucide-react";

const AppHeader: React.FC = () => {
  const { title } = useHeader();
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
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

  const logout = () => {
    setOpen(false);
    authLogout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
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
        </div>

        {title && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
        )}

        <div className="relative" ref={menuRef}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border bg-card shadow-md">
              <button
                type="button"
                onClick={goToProfile}
                className="w-full px-3 py-2 text-left hover:bg-accent"
              >
                My Profile
              </button>
              <button
                type="button"
                onClick={goToSearch}
                className="w-full px-3 py-2 text-left hover:bg-accent"
              >
                Search Players
              </button>
              <button
                type="button"
                onClick={goToRecordMatch}
                className="w-full px-3 py-2 text-left hover:bg-accent"
              >
                Add Match
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={logout}
                className="w-full px-3 py-2 text-left text-red-600 hover:bg-accent"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
      <NavigationProgress />
    </header>
  );
};

export default AppHeader;

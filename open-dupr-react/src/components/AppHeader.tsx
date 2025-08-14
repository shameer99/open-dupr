import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { setTheme } = useTheme();
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

  const toggleTheme = () => {
    setTheme();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <button
          type="button"
          onClick={goToProfile}
          className="flex items-center gap-1 font-semibold tracking-tight text-lg"
          aria-label="Go to profile"
        >
          <img
            src="/logo.png"
            alt="Open DUPR"
            className="block h-8 w-8 shrink-0"
          />
          <span className="inline-block leading-none max-[320px]:hidden">
            Open DUPR
          </span>
        </button>

        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

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

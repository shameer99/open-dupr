import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { extractApiErrorMessage } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setToken, setRefreshToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiFetch("/auth/v1/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setToken(data.result.accessToken);
      setRefreshToken(data.result.refreshToken);
      navigate("/profile");
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, "Login failed"));
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 safe-area-inset-y">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center items-center mb-4">
            <img src="/logo.png" alt="Open DUPR Logo" className="w-24 h-24" />
          </div>
          <h1 className="text-3xl font-bold">Open DUPR</h1>
          <p className="text-muted-foreground mt-2">
            A faster, cleaner, and more open way to access your DUPR data.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-sm mt-8">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-left">
                DUPR Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-left">
                DUPR Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
          <div className="flex flex-col gap-4 mt-6">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              <p>
                Don't have an account?{" "}
                <a
                  href="https://dashboard.dupr.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Create one on DUPR
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>
      <footer className="w-full py-4">
        <div className="text-xs text-center text-muted-foreground max-w-xl mx-auto px-4">
          <p>
            Open DUPR is a custom frontend for DUPR. All data is handled by the
            official DUPR backend.{" "}
            <button
              onClick={() => navigate("/about")}
              className="underline hover:text-foreground transition-colors"
            >
              Learn more about Open DUPR
            </button>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

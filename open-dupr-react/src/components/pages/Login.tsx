import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { extractApiErrorMessage } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TWO_FACTOR_CHALLENGE =
  "urn:dupr:required-action:two-factor-challenge";
const EMAIL_FACTOR = "urn:dupr:second-factor:email";
const SMS_FACTOR = "urn:dupr:second-factor:sms";
const TOTP_FACTOR = "urn:dupr:second-factor:totp";

interface TwoFactorChallenge {
  challengeToken: string;
  methods: string[];
}

interface ApiErrorWithResponse extends Error {
  response?: {
    data?: unknown;
    status?: number;
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getTwoFactorChallenge(error: unknown): TwoFactorChallenge | null {
  const responseData = asRecord((error as ApiErrorWithResponse)?.response?.data);
  const requirements = responseData?.requirements;

  if (!Array.isArray(requirements)) {
    return null;
  }

  const challenge = requirements.find(
    (requirement) => asRecord(requirement)?.type === TWO_FACTOR_CHALLENGE
  );
  const challengeRecord = asRecord(challenge);
  const challengeToken = challengeRecord?.challengeToken;

  if (typeof challengeToken !== "string") {
    return null;
  }

  const methods = Array.isArray(challengeRecord?.methods)
    ? challengeRecord.methods
        .map((method) => asRecord(method)?.type)
        .filter((type): type is string => typeof type === "string")
    : [];

  return { challengeToken, methods };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState<TwoFactorChallenge | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { setToken, setRefreshToken } = useAuth();
  const navigate = useNavigate();

  const completeLogin = (data: {
    result?: { accessToken?: string; refreshToken?: string };
  }) => {
    const accessToken = data.result?.accessToken;
    const refreshToken = data.result?.refreshToken;

    if (!accessToken || !refreshToken) {
      throw new Error("DUPR did not return sign-in tokens");
    }

    setToken(accessToken);
    setRefreshToken(refreshToken);
    navigate("/profile");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await apiFetch("/auth/v1.0/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      completeLogin(data);
    } catch (err: unknown) {
      const challenge = getTwoFactorChallenge(err);

      if (challenge) {
        setTwoFactor(challenge);
        setPassword("");
      } else {
        setError(extractApiErrorMessage(err, "Login failed"));
      }
    }

    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactor || verificationCode.length !== 6) {
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await apiFetch("/auth/v1.0/2fa/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeToken: twoFactor.challengeToken,
          code: verificationCode,
          ...(twoFactor.methods.includes(TOTP_FACTOR)
            ? { method: { type: TOTP_FACTOR } }
            : {}),
        }),
      });

      completeLogin(data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, "That code was not accepted"));
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!twoFactor) {
      return;
    }

    setResending(true);
    setError(null);
    setNotice(null);

    try {
      await apiFetch("/auth/v1.0/2fa/resend", {
        method: "POST",
        body: JSON.stringify({ challengeToken: twoFactor.challengeToken }),
      });
      setVerificationCode("");
      setNotice("A new code was sent.");
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, "Could not resend the code"));
    }

    setResending(false);
  };

  const useAuthenticator = twoFactor?.methods.includes(TOTP_FACTOR) ?? false;
  const canResend =
    twoFactor !== null &&
    (twoFactor.methods.length === 0 ||
      twoFactor.methods.includes(EMAIL_FACTOR) ||
      twoFactor.methods.includes(SMS_FACTOR));

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
        <form
          onSubmit={twoFactor ? handleVerify : handleSubmit}
          className="w-full max-w-sm mt-8"
        >
          <div className="grid gap-4">
            {twoFactor ? (
              <>
                <p className="text-sm text-center text-muted-foreground">
                  {useAuthenticator
                    ? "Enter the 6-digit code from your authenticator app."
                    : `Enter the 6-digit code DUPR emailed to ${email}.`}
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="verification-code" className="text-left">
                    Verification code
                  </Label>
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    className="text-center text-2xl tracking-[0.5em]"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-left">
                    DUPR Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-left">
                    DUPR Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            {notice && (
              <p className="text-muted-foreground text-sm text-center">
                {notice}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-4 mt-6">
            <Button
              className="w-full"
              type="submit"
              disabled={
                loading || (twoFactor !== null && verificationCode.length !== 6)
              }
            >
              {loading
                ? twoFactor
                  ? "Verifying..."
                  : "Signing in..."
                : twoFactor
                  ? "Verify and sign in"
                  : "Sign in"}
            </Button>
            {twoFactor && (
              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                {canResend && (
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                    disabled={resending}
                    onClick={handleResend}
                  >
                    {resending ? "Resending..." : "Resend code"}
                  </button>
                )}
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => {
                    setTwoFactor(null);
                    setVerificationCode("");
                    setError(null);
                    setNotice(null);
                  }}
                >
                  Back to sign in
                </button>
              </div>
            )}
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
            Open DUPR is a client for DUPR&apos;s API—your account and match data
            stay on DUPR&apos;s servers; we don&apos;t store them on ours.{" "}
            <button
              onClick={() => navigate("/about")}
              className="underline hover:text-foreground transition-colors cursor-pointer"
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

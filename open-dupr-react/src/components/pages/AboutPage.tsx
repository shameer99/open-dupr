import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/useAuth";
import { useNavigate } from "react-router-dom";
import { Github, ExternalLink, ArrowLeft } from "lucide-react";

const CODE = "text-xs bg-muted px-1 py-0.5 rounded";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {children}
    </div>
  );
}

export default function AboutPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 safe-area-inset-y">
      <div className="flex items-center justify-between py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(token ? "/profile" : "/login")}
          className="shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">About</h1>
        <div className="w-10" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-2xl text-center space-y-4">
          <div className="flex justify-center items-center">
            <img src="/logo.png" alt="Open DUPR Logo" className="w-20 h-20" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Open DUPR</h1>
            <p className="text-lg text-muted-foreground">
              A faster, cleaner way to access your DUPR data.
            </p>
          </div>

          <Card className="p-4 text-left space-y-4">
            <div className="space-y-3">
              <Section title="What is Open DUPR?">
                <p className="text-muted-foreground text-sm">
                  A faster, ad-free frontend for your DUPR pickleball data.
                  Fully compatible with the official DUPR backend.
                </p>
              </Section>

              <Section title="Why use Open DUPR?">
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Faster and more responsive</li>
                  <li>No ads, popups, or upsells</li>
                  <li>Cleaner design</li>
                  <li>Streamlined match creation and validation</li>
                </ul>
              </Section>

              <Section title="Is my data safe?">
                <p className="text-muted-foreground text-sm">
                  Yes. Your data lives on DUPR&apos;s servers. Open DUPR is a
                  client for their API and does not store your information.
                  Credentials are only used to sign you in with DUPR.
                </p>
              </Section>

              <Section title="How do API requests work?">
                <p className="text-muted-foreground text-sm">
                  Your browser only talks to this site. Requests under{" "}
                  <code className={CODE}>/api</code> are proxied server-side to{" "}
                  <code className={CODE}>api.dupr.gg</code>, avoiding
                  cross-origin restrictions.
                </p>
              </Section>

              <Section title="Analytics">
                <p className="text-muted-foreground text-sm">
                  We use{" "}
                  <a
                    href="https://cloud.umami.is/share/hd9kfrVkKVc4YoWf/opendupr.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Umami
                  </a>
                  —a privacy-focused, cookie-free analytics tool. All data is
                  anonymous and publicly viewable.
                </p>
              </Section>

              <Section title="Open source">
                <p className="text-muted-foreground text-sm">
                  The code is freely available on GitHub for anyone to view,
                  modify, or contribute to.
                </p>
              </Section>

              <Section title="Affiliation">
                <p className="text-muted-foreground text-sm">
                  Open DUPR is not affiliated with DUPR. All trademarks and data
                  belong to their respective owners.
                </p>
              </Section>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() =>
                window.open("https://github.com/shameer99/open-dupr", "_blank")
              }
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                window.open("https://dashboard.dupr.com", "_blank")
              }
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Official DUPR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

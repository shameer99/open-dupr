import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/useAuth";
import { useNavigate } from "react-router-dom";
import { Github, ExternalLink, ArrowLeft } from "lucide-react";

export default function AboutPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (token) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 safe-area-inset-y">
      <div className="flex items-center justify-between py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
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
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  What is Open DUPR?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Open DUPR is a custom frontend for DUPR that provides a
                  faster, cleaner interface for accessing your pickleball data.
                  Built with modern web technologies, it offers an enhanced user
                  experience while maintaining full compatibility with the
                  official DUPR backend.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Why use Open DUPR over the official app?
                </h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Faster and more responsive interface</li>
                  <li>Cleaner, modern design without clutter</li>
                  <li>Streamlined match creation and validation process</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-1">Is my data safe?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes! All data is handled by the official DUPR backend. Open
                  DUPR does not store any personal information or match data.
                  Your credentials are used only to authenticate with DUPR's
                  official API.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Is Open DUPR open source?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Yes, Open DUPR is an open-source project. The code is freely
                  available for anyone to view, modify, and contribute to on
                  GitHub.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Is Open DUPR affiliated with DUPR?
                </h3>
                <p className="text-muted-foreground text-sm">
                  No, Open DUPR is not affiliated with DUPR. All trademarks and
                  data belong to their respective owners.
                </p>
              </div>
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

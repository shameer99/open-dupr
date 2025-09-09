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
        <h1 className="text-lg font-semibold tracking-tight">
          About Open DUPR
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-2xl text-center space-y-6">
          <div className="flex justify-center items-center mb-6">
            <img src="/logo.png" alt="Open DUPR Logo" className="w-24 h-24" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Open DUPR</h1>
            <p className="text-xl text-muted-foreground">
              A faster, cleaner, and more open way to access your DUPR data.
            </p>
          </div>

          <Card className="p-6 text-left space-y-4">
            <h2 className="text-2xl font-semibold">About Open DUPR</h2>
            <p className="text-muted-foreground leading-relaxed">
              Open DUPR is a custom frontend for DUPR (Dynamic Universal
              Pickleball Rating) that provides a faster, cleaner, and more
              intuitive interface for accessing your pickleball data. Built with
              modern web technologies, it offers an enhanced user experience
              while maintaining full compatibility with the official DUPR
              backend.
            </p>

            <h3 className="text-xl font-semibold mt-6">Key Features</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Fast and responsive interface</li>
              <li>Clean, modern design</li>
              <li>Mobile-optimized experience</li>
              <li>Real-time match validation</li>
              <li>Comprehensive player statistics</li>
              <li>Social features and player discovery</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">Data & Privacy</h3>
            <p className="text-muted-foreground leading-relaxed">
              All data is handled by the official DUPR backend. Open DUPR does
              not store any personal information or match data. Your credentials
              are used only to authenticate with DUPR's official API, ensuring
              your data remains secure and under your control.
            </p>

            <h3 className="text-xl font-semibold mt-6">Open Source</h3>
            <p className="text-muted-foreground leading-relaxed">
              Open DUPR is an open-source project, meaning the code is freely
              available for anyone to view, modify, and contribute to. This
              transparency ensures the project remains trustworthy and
              community-driven.
            </p>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

        <footer className="w-full py-4">
          <div className="text-xs text-center text-muted-foreground max-w-xl mx-auto px-4">
            <p>
              Open DUPR is not affiliated with DUPR. All trademarks and data
              belong to their respective owners.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./lib/AuthProvider.tsx";
import { LoadingProvider } from "./lib/loading-context.tsx";
import { HeaderProvider } from "./lib/header-context.tsx";
import ThemeProvider from "./lib/theme-context.tsx";
import LoginPage from "./components/pages/Login.tsx";
import AboutPage from "./components/pages/AboutPage.tsx";
import ProfilePage from "./components/pages/ProfilePage.tsx";
import ProfileSuspense from "./components/ui/ProfileSuspense.tsx";

import FollowersFollowingPage from "./components/pages/FollowersFollowingPage.tsx";
import OtherUserPage from "./components/pages/OtherUserPage.tsx";
import NotFoundPage from "./components/pages/NotFoundPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AppShell from "./components/AppShell.tsx";
import SearchPage from "./components/pages/SearchPage.tsx";
import RecordMatchPage from "./components/pages/RecordMatchPage.tsx";
import ValidationQueuePage from "./components/pages/ValidationQueuePage.tsx";
import MatchDetailsPage from "./components/pages/MatchDetailsPage.tsx";
import FeedPage from "./components/pages/FeedPage.tsx";

// PWA service worker registration with auto-update and reload
import { registerSW } from "virtual:pwa-register";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <HeaderProvider>
            <Router>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <ProfileSuspense>
                          <ProfilePage />
                        </ProfileSuspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/feed"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <FeedPage />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/user/:id/social"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <FollowersFollowingPage />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/player/:id"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <ProfileSuspense>
                          <OtherUserPage />
                        </ProfileSuspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <SearchPage />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/record-match"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <RecordMatchPage />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/validation-queue"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <ValidationQueuePage />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/match/:id"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <MatchDetailsPage />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/match/:id/player/:playerId"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <MatchDetailsPage />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </HeaderProvider>
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// Register the service worker to auto-update and reload when a new version is available
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  let hasRefreshed = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hasRefreshed) return;
    hasRefreshed = true;
    window.location.reload();
  });

  const updateSW = registerSW({
    immediate: true,
    onRegistered(registration) {
      if (!registration) return;
      const HOUR = 60 * 60 * 1000;
      // Periodically check for updates
      setInterval(() => {
        registration.update().catch(() => {});
      }, HOUR);
      // Check for updates when app becomes visible
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      });
    },
    // If a new SW is waiting, ask it to skip waiting and take control
    onNeedRefresh() {
      updateSW(true);
    },
  });
}

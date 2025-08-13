import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./lib/AuthProvider.tsx";
import LoginPage from "./components/pages/Login.tsx";
import ProfilePage from "./components/pages/ProfilePage.tsx";

import FollowersPage from "./components/pages/FollowersPage.tsx";
import FollowingPage from "./components/pages/FollowingPage.tsx";
import OtherUserPage from "./components/pages/OtherUserPage.tsx";
import NotFoundPage from "./components/pages/NotFoundPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AppShell from "./components/AppShell.tsx";
import SearchPage from "./components/pages/SearchPage.tsx";
import RecordMatchPage from "./components/pages/RecordMatchPage.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ProfilePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/:id/followers"
            element={
              <ProtectedRoute>
                <AppShell>
                  <FollowersPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/:id/following"
            element={
              <ProtectedRoute>
                <AppShell>
                  <FollowingPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <OtherUserPage />
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);

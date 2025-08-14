import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import App from "../App";
import LoginPage from "./pages/Login";
import ProfilePage from "./pages/ProfilePage";
import { AnimatePresence } from "framer-motion";
import FollowersFollowingPage from "./pages/FollowersFollowingPage";
import OtherUserPage from "./pages/OtherUserPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";
import AppShell from "./AppShell";
import SearchPage from "./pages/SearchPage";
import RecordMatchPage from "./pages/RecordMatchPage";
import ValidationQueuePage from "./pages/ValidationQueuePage";
import MatchDetailsPage from "./pages/MatchDetailsPage";

const Root = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.key}>
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
    </AnimatePresence>
  );
};

export default Root;

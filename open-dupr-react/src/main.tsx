import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthProvider.tsx';
import LoginPage from './components/pages/Login.tsx';
import ProfilePage from './components/pages/ProfilePage.tsx';
import PlayerPage from './components/pages/PlayerPage.tsx';
import NotFoundPage from './components/pages/NotFoundPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
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
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/:id"
            element={
              <ProtectedRoute>
                <PlayerPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);

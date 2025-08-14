import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./lib/AuthProvider.tsx";
import { LoadingProvider } from "./lib/loading-context.tsx";
import Root from "./components/Root.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <Root />
        </Router>
      </LoadingProvider>
    </AuthProvider>
  </React.StrictMode>
);

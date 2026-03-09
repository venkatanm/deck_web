import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { isMarketingDomain, getAppUrl } from "./config/domains.js";

/** Redirect to app domain (decks.datavelox.com) for login/register when on marketing domain */
function RedirectToApp({ path }) {
  window.location.href = `${getAppUrl()}${path}`;
  return null;
}

/** Root path on app domain: redirect to /home if logged in, else /login */
function AppRootRedirect() {
  const token = localStorage.getItem("auth_token");
  return <Navigate to={token ? "/home" : "/login"} replace />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Marketing domain (www.datavelox.com, datavelox.com): landing only; login/register redirect to app */}
            {isMarketingDomain() && (
              <>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<RedirectToApp path="/login" />} />
                <Route path="/register" element={<RedirectToApp path="/register" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
            {/* App domain (decks.datavelox.com): full app; / redirects to login or home */}
            {!isMarketingDomain() && (
              <>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/home"
                  element={
                    <RequireAuth>
                      <HomePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/editor"
                  element={
                    <RequireAuth>
                      <App />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <AdminPage />
                    </RequireAuth>
                  }
                />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/" element={<AppRootRedirect />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);

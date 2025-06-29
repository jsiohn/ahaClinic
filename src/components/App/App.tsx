import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import ClientsPage from "../../pages/Clients/ClientsPage";
import AnimalsPage from "../../pages/Animals/AnimalsPage";
import InvoicesPage from "../../pages/Invoices/InvoicesPage";
import OrganizationsPage from "../../pages/Organizations/OrganizationsPage";
import BlacklistPage from "../../pages/Blacklist/BlacklistPage";
import DocumentsPage from "../../pages/Documents/DocumentsPage";
import Landing from "../../pages/Auth/Landing";
import AuthModal from "./AuthModal";
import ApiDebug from "../ApiDebug";
import "./App.css";

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: "#2196f3",
    },
    secondary: {
      main: "#f50057",
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleOpenAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === "login" ? "register" : "login");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Auth landing page */}
          <Route
            path="/auth"
            element={
              <Landing
                onLogin={() => handleOpenAuthModal("login")}
                onRegister={() => handleOpenAuthModal("register")}
              />
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/clients" replace />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="animals" element={<AnimalsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="blacklist" element={<BlacklistPage />} />
          </Route>
        </Routes>

        <AuthModal
          open={authModalOpen}
          onClose={handleCloseAuthModal}
          mode={authMode}
          onSwitchMode={handleSwitchAuthMode}
        />
        <ApiDebug />
      </Router>
    </ThemeProvider>
  );
}

export default App;

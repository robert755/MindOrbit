import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DailyCheckInPage from "./pages/DailyCheckInPage";
import ReflectionJournalPage from "./pages/ReflexionPage";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("userId");
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publice */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rute Protejate - doar pentru utilizatori logați */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/daily-check-in" 
          element={
            <ProtectedRoute>
              <DailyCheckInPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reflection-journal" 
          element={
            <ProtectedRoute>
              <ReflectionJournalPage />
            </ProtectedRoute>
          } 
        />

        {/* Redirecționare pentru orice altă rută inexistentă */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
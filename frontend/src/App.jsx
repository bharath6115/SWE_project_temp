import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import StudentMapPage from "./pages/StudentMapPage";
import DriverPanelPage from "./pages/DriverPanelPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useLocationContext } from "./context/LocationContext";

function App() {
  const { requestLocation } = useLocationContext();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/student" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/student" element={<StudentMapPage />} />
        <Route
          path="/driver"
          element={
            <ProtectedRoute roles={["driver"]}>
              <DriverPanelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "./context/AuthContext";
import { LocationProvider } from "./context/LocationContext";
import { ToastProvider } from "./context/ToastContext";
import Toast from "./components/Toast";
import { registerServiceWorker } from "./utils/registerServiceWorker";
import AppErrorBoundary from "./components/AppErrorBoundary";

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <LocationProvider>
              <App />
              <Toast />
            </LocationProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
);

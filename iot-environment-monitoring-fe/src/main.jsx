import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { SensorProvider } from "./context/SensorContext";
import "./index.css";
import router from "./router/index.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <SensorProvider>
        <RouterProvider router={router} />
      </SensorProvider>
    </ErrorBoundary>
  </StrictMode>,
);

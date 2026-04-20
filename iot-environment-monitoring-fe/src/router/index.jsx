import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

// Import các trang (Lazy load hoặc import thường tùy bạn, ở đây dùng import thường cho đơn giản)
import Dashboard from "../pages/Dashboard";
import DataSensor from "../pages/DataSensor";
import ActionHistory from "../pages/ActionHistory";
import DeviceManagement from "../pages/DeviceManagement";
import Profile from "../pages/Profile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />, // Layout chứa Header
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "datasensor",
        element: <DataSensor />,
      },
      {
        path: "history",
        element: <ActionHistory />,
      },
      {
        path: "device-management",
        element: <DeviceManagement />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />, // Redirect 404 về dashboard
  },
]);

export default router;

import { Outlet } from "react-router-dom";
import Header from "../components/Header"; // Import component vừa tách

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Gọi Component Header */}
      <Header />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="max-w-[1440px] mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

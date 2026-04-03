import { Outlet } from "react-router-dom";
import Header from "../components/Header"; // Import component vừa tách

const MainLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] overflow-hidden">
      {/* Gọi Component Header */}
      <Header />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

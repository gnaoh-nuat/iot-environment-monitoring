import { NavLink } from "react-router-dom";
import { MdSensors, MdHistory, MdPerson } from "react-icons/md";
import { IoIosSpeedometer } from "react-icons/io";
import { RiBarChartGroupedFill } from "react-icons/ri";

const Header = () => {
  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <IoIosSpeedometer className="text-lg" />,
    },
    {
      path: "/datasensor",
      label: "DataSensor",
      icon: <MdSensors className="text-lg" />,
    },
    {
      path: "/history",
      label: "Action History",
      icon: <MdHistory className="text-lg" />,
    },
    {
      path: "/device-management",
      label: "Device Management",
      icon: <RiBarChartGroupedFill className="text-lg" />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <MdPerson className="text-lg" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1440px] mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* === LOGO BRANDING XỊN XÒ === */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <IoIosSpeedometer className="text-2xl" />
          </div>
          <span className="text-[20px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-600">
            IoT Monitor
          </span>
        </div>

        {/* === MÀN HÌNH LỚN: NAVIGATION MENU DẠNG SEGMENTED CONTROL === */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[13px] tracking-wide transition-all duration-300 ${
                  isActive
                    ? "bg-white text-blue-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]" // Style nút đang chọn (Nổi lên)
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50" // Style nút chưa chọn
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* === BÊN PHẢI: AVATAR / PROFILE MINI === */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-200 transition-colors">
            <MdPerson className="text-xl" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

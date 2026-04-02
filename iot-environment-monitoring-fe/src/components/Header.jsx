import { NavLink } from "react-router-dom";
import { MdSensors, MdHistory, MdPerson } from "react-icons/md";
import { IoIosSpeedometer } from "react-icons/io";

const Header = () => {
  // Định nghĩa danh sách menu tại đây
  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <IoIosSpeedometer className="text-xl" />,
    },
    {
      path: "/datasensor",
      label: "DataSensor",
      icon: <MdSensors className="text-xl" />,
    },
    {
      path: "/history",
      label: "Action History",
      icon: <MdHistory className="text-xl" />,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: <MdPerson className="text-xl" />,
    },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <IoIosSpeedometer />
          </div>
          <span className="text-xl font-bold text-slate-800">IoT Monitor</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-md translate-y-[-1px]"
                    : "bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-blue-600"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;

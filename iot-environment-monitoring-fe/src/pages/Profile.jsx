import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  FileCode2,
  ExternalLink,
  ArrowRight,
  Link,
  User,
  Briefcase,
} from "lucide-react";
// IMPORT THÊM LOGO THƯƠNG HIỆU TỪ REACT-ICONS
import { FaGithub, FaFigma } from "react-icons/fa";

export default function Profile() {
  const resources = [
    {
      id: 1,
      title: "Báo cáo PDF",
      description: "Tải xuống báo cáo chi tiết về hệ thống IoT",
      icon: FileText,
      color: "bg-red-500",
      link: "https://drive.google.com/drive/folders/1ElVoZ2DbvIqXL1Teb3fvIt9WGxnfgst0?hl=vi",
    },
    {
      id: 2,
      title: "API Documentation",
      description: "Tài liệu hướng dẫn sử dụng API",
      icon: FileCode2,
      color: "bg-emerald-500",
      link: "http://localhost:5000",
    },
    {
      id: 3,
      title: "Github Repository",
      description: "Mã nguồn dự án trên Github",
      icon: FaGithub, // Sử dụng icon từ react-icons/fa
      color: "bg-slate-800",
      link: "https://github.com/gnaoh-nuat/iot-environment-monitoring.git",
    },
    {
      id: 4,
      title: "Figma Design",
      description: "Thiết kế giao diện trên Figma",
      icon: FaFigma, // Sử dụng icon từ react-icons/fa
      color: "bg-purple-500",
      link: "https://www.figma.com/design/A4QJ9ZR10Voct51FLqFhaI/IOTProject?node-id=0-1&t=FIzlUN2U1Dv6EHBr-1",
    },
  ];

  return (
    // No scroll layout
    <div className="h-full flex flex-col gap-4 overflow-hidden p-4">
      {/* Profile Info Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Thông tin cá nhân
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-blue-50 shadow-sm">
              HMT
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Online
              </span>
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 w-full pt-1">
            <h1 className="text-xl font-bold text-gray-900 mb-1.5">
              Hoàng Mạnh Tuấn
            </h1>

            <p className="text-sm text-gray-500 font-medium mb-5 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              Game Developer
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-5">
              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-semibold mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    hoangmanhtuan2810@gmail.com
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-semibold mb-0.5">
                    Số điện thoại
                  </p>
                  <p className="text-sm font-bold text-gray-800">0944796256</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-sm flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-semibold mb-0.5">
                    Địa chỉ
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    Hà Nội, Việt Nam
                  </p>
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-semibold mb-0.5">
                    Ngày tham gia
                  </p>
                  <p className="text-sm font-bold text-gray-800">01/01/2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Tài nguyên & Liên kết
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
          {resources.map((resource) => {
            const Icon = resource.icon;

            return (
              <a
                key={resource.id}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${resource.color} flex items-center justify-center shadow-sm flex-shrink-0`}
                    >
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>

                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
                  </div>

                  <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                    {resource.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {resource.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                    Nhấn để truy cập
                    <ArrowRight className="w-3.5 h-3.5 transform transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

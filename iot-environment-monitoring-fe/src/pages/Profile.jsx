import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Code,
  FolderGit,
  Palette,
  ExternalLink,
} from "lucide-react";

export default function Profile() {
  const resources = [
    {
      id: 1,
      title: "Báo cáo PDF",
      description: "Tải xuống báo cáo chi tiết về hệ thống IoT",
      icon: FileText,
      color: "bg-red-500",
      link: "#",
    },
    {
      id: 2,
      title: "API Documentation",
      description: "Tài liệu hướng dẫn sử dụng API",
      icon: Code,
      color: "bg-emerald-500",
      link: "#",
    },
    {
      id: 3,
      title: "Github Repository",
      description: "Mã nguồn dự án trên Github",
      icon: FolderGit,
      color: "bg-slate-800",
      link: "#",
    },
    {
      id: 4,
      title: "Figma Design",
      description: "Thiết kế giao diện trên Figma",
      icon: Palette,
      color: "bg-purple-500",
      link: "#",
    },
  ];

  return (
    // Sử dụng h-full và overflow-y-auto để component tự thích ứng với MainLayout
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-4">
      {/* 1. Profile Info Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex-shrink-0">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Avatar & Status */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-50 shadow-sm">
              HMT
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Online
              </span>
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Hoàng Mạnh Tuấn
            </h1>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Frontend Engineer
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <Mail className="w-5 h-5 text-blue-600" />
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
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 border border-green-100">
                  <Phone className="w-5 h-5 text-green-600" />
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
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100">
                  <MapPin className="w-5 h-5 text-purple-600" />
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
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                  <Calendar className="w-5 h-5 text-amber-600" />
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

      {/* 2. Resources Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <h2 className="text-base font-bold text-gray-800 mb-4 uppercase tracking-wide">
          Tài nguyên & Liên kết
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <a
                key={resource.id}
                href={resource.link}
                className="group bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${resource.color} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>

                  <h3 className="text-base font-bold text-gray-800 mb-1.5 group-hover:text-blue-600 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {resource.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                    Nhấn để truy cập <span>→</span>
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

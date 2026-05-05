import React from "react";
import { Link } from "react-router-dom";

export default function UserSidebar() {
  const menus = [
    { name: "Explore Services", path: "/user/dashboard", icon: "🔍" },
    { name: "My Bookings", path: "/user/my-bookings", icon: "📅" },
    { name: "Compare Providers", path: "/user/compare", icon: "⚖️" },
    { name: "Support & Disputes", path: "/user/support", icon: "🎧" },
  ];

  return (
    <div className="w-64 bg-white border-r h-screen p-5 fixed">
      <h2 className="text-2xl font-bold mb-10 text-blue-600">LocalServe</h2>
      <nav className="space-y-4">
        {menus.map((menu) => (
          <Link key={menu.name} to={menu.path} className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg text-gray-700 transition font-medium">
            <span>{menu.icon}</span>
            {menu.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
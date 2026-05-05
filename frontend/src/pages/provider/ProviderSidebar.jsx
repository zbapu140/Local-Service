import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  DollarSign, 
  Star, 
  Tag,
  LogOut,
  Zap
} from "lucide-react";

export default function ProviderSidebar() {
  const location = useLocation();
  
  const menus = [
    { name: "Dashboard", path: "/provider/dashboard", icon: LayoutDashboard, color: "text-indigo-400" },
    { name: "Manage Bookings", path: "/provider/bookings", icon: Calendar, color: "text-blue-400" },
    { name: "My Profile", path: "/provider/profile", icon: User, color: "text-green-400" },
    { name: "Earnings", path: "/provider/earnings", icon: DollarSign, color: "text-yellow-400" },
    { name: "Reviews", path: "/provider/reviews", icon: Star, color: "text-purple-400" },
    { name: "Promotions", path: "/provider/promotions", icon: Tag, color: "text-pink-400" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="w-72 bg-gradient-to-b from-indigo-900 to-purple-900 h-screen text-white fixed left-0 top-0 shadow-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Provider Pro</h2>
            <p className="text-xs text-indigo-300">Service Management</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {menus.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.path);
            
            return (
              <Link 
                key={menu.name} 
                to={menu.path} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                  active 
                    ? "bg-white/20 shadow-lg" 
                    : "hover:bg-white/10"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? menu.color : 'text-indigo-300'} transition`} />
                <span className={`font-medium ${active ? 'text-white' : 'text-indigo-200'}`}>
                  {menu.name}
                </span>
                {active && (
                  <div className="ml-auto w-1 h-6 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-8 left-0 right-0 px-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition w-full text-indigo-200 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, LogOut, Shield } from 'lucide-react';

export default function AdminSidebar() {
  const location = useLocation();
  const menus = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Providers', path: '/admin/providers', icon: Users },
    { name: 'Withdrawals', path: '/admin/withdrawals', icon: DollarSign },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <Shield className="w-8 h-8 text-indigo-400" />
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="space-y-2">
          {menus.map((menu) => {
            const Icon = menu.icon;
            const active = location.pathname === menu.path;
            return (
              <Link
                key={menu.name}
                to={menu.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition ${
                  active ? 'bg-indigo-600' : 'hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{menu.name}</span>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition w-full mt-10 text-gray-300"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
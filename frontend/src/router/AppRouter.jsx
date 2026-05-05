import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Login from "../components/Login";
import Signup from "../components/Signup";
import ForgotPassword from "../components/ForgotPassword";
import ResetPassword from "../components/ResetPassword";

import UserDashboard from "../pages/user/UserDashboard";
import ProviderBookings from "../pages/provider/ProviderBookings";



import UserSidebar from "../pages/user/UserSidebar";
import CompareProviders from "../pages/user/CompareProviders";
import MyBookings from "../pages/user/MyBookings";
import UserSupport from "../pages/user/UserSupport";
import ProviderSidebar from "../pages/provider/ProviderSidebar";
import ProviderProfile from "../pages/provider/ProviderProfile";
import ProviderEarnings from "../pages/provider/ProviderEarnings";
import ProviderReviews from "../pages/provider/ProviderReviews"; 
import ProviderPromotions from "../pages/provider/ProviderPromotions"; 

import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProviders from '../pages/admin/AdminProviders';
import AdminWithdrawals from '../pages/admin/AdminWithdrawals';

// Layout for user
const UserLayout = () => (
  <div className="flex bg-gray-50">
    <UserSidebar />
    <div className="flex-1">
      <Outlet />
    </div>
  </div>
);

// Provider layout
const ProviderLayout = () => (
  <div className="flex">
    <ProviderSidebar />
    <div className="flex-1">
      <Outlet />
    </div>
  </div>
);

// Auth Guard Component
const AuthGuard = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/';
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    window.location.href = '/';
    return null;
  }

  return children;
};

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  {path: "/reset-password/:token", element: <ResetPassword />},
  {
    path: "/user",
    element: (
      <AuthGuard allowedRoles={['user']}>
        <UserLayout />
      </AuthGuard>
    ),
    children: [
      { path: "dashboard", element: <UserDashboard /> },
      { path: "compare", element: <CompareProviders /> },
      { path: "my-bookings", element: <MyBookings /> },
      { path: "support", element: <UserSupport /> },
      { index: true, element: <UserDashboard /> }
    ]
  },
  {
    path: "/provider",
    element: (
      <AuthGuard allowedRoles={['provider']}>
        <ProviderLayout />
      </AuthGuard>
    ),
    children: [
      { path: "dashboard", element: <ProviderBookings /> },
      { path: "bookings", element: <ProviderBookings /> },
      { path: "profile", element: <ProviderProfile /> },
      { path: "earnings", element: <ProviderEarnings /> },
      { path: "reviews", element: <ProviderReviews /> }, 
      { path: "promotions", element: <ProviderPromotions /> },
      { index: true, element: <ProviderBookings /> }
    ]
  },
  {
  path: "/admin",
  element: (
    <AuthGuard allowedRoles={['admin']}>
      <AdminLayout />
    </AuthGuard>
  ),
  children: [
    { path: "dashboard", element: <AdminDashboard /> },
    { path: "providers", element: <AdminProviders /> },
    { path: "withdrawals", element: <AdminWithdrawals /> },
    { index: true, element: <AdminDashboard /> }
  ]
}
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
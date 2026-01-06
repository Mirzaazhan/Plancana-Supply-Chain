// src/components/layout/Layout.js
"use client";
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Map,
  ArrowLeftRight,
  Shield,
  BarChart3,
  User,
  Settings,
  Clock,
  Factory,
  Search as SearchIcon,
  TrendingUp,
  Users,
  Package,
  Activity,
  Wrench,
  LogOut,
} from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Role-based color scheme
  const getRoleColors = () => {
    switch (user?.role) {
      case "FARMER":
        return {
          bg: "bg-green-600",
          text: "text-green-600",
          hover: "hover:bg-green-50",
          active: "bg-green-100 text-green-700",
          ring: "focus:ring-green-500",
        };
      case "PROCESSOR":
        return {
          bg: "bg-blue-600",
          text: "text-blue-600",
          hover: "hover:bg-blue-50",
          active: "bg-blue-100 text-blue-700",
          ring: "focus:ring-blue-500",
        };
      case "DISTRIBUTOR":
        return {
          bg: "bg-purple-600",
          text: "text-purple-600",
          hover: "hover:bg-purple-50",
          active: "bg-purple-100 text-purple-700",
          ring: "focus:ring-purple-500",
        };
      case "ADMIN":
        return {
          bg: "bg-gray-800",
          text: "text-gray-800",
          hover: "hover:bg-gray-50",
          active: "bg-gray-100 text-gray-900",
          ring: "focus:ring-gray-500",
        };
      default:
        return {
          bg: "bg-green-600",
          text: "text-green-600",
          hover: "hover:bg-green-50",
          active: "bg-green-100 text-green-700",
          ring: "focus:ring-green-500",
        };
    }
  };

  const roleColors = getRoleColors();

  const navigationItems = {
    FARMER: [
      { name: "Dashboard", href: "/farmer/dashboard", icon: LayoutGrid },
      {
        name: "Batch Registration",
        href: "/farmer/batch-registration",
        icon: FileText,
      },
      { name: "GIS Mapping", href: "/gis", icon: Map },
      { name: "Quality Analytics", href: "/analytics", icon: BarChart3 },
      {
        name: "Transactions",
        href: "/farmer/transactions",
        icon: ArrowLeftRight,
      },
      { name: "Compliance", href: "/farmer/compliance", icon: Shield },
      { name: "Reports", href: "/farmer/reports", icon: BarChart3 },
      { name: "Profile", href: "/farmer/profile", icon: User },
      { name: "Settings", href: "/farmer/settings", icon: Settings },
    ],
    PROCESSOR: [
      { name: "Dashboard", href: "/processor/dashboard", icon: LayoutGrid },
      { name: "GIS Mapping", href: "/gis", icon: Map },
      { name: "Quality Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Processing Queue", href: "/processor/queue", icon: Clock },
      { name: "My Processes", href: "/processor/processes", icon: Factory },
      { name: "Quality Control", href: "/processor/quality", icon: SearchIcon },
      { name: "Reports", href: "/processor/reports", icon: BarChart3 },
      { name: "Profile", href: "/processor/profile", icon: User },
      { name: "Settings", href: "/processor/settings", icon: Settings },
    ],
    DISTRIBUTOR: [
      { name: "Dashboard", href: "/distributor/dashboard", icon: LayoutGrid },
      { name: "GIS Mapping", href: "/gis", icon: Map },
    ],
    ADMIN: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutGrid },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "All Batches", href: "/admin/batches", icon: Package },
      { name: "System", href: "/admin/system", icon: Settings },
      { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
      { name: "Profile", href: "/admin/profile", icon: User },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  };

  const currentNavItems = navigationItems[user?.role] || [];
  const getProfileImage = () => {
    let imagePath;

    switch (user?.role) {
      case "FARMER":
        imagePath = user?.farmerProfile?.profileImage;
        break;
      case "PROCESSOR":
        imagePath = user?.processorProfile?.profileImage;
        break;
      case "ADMIN":
        imagePath = user?.adminProfile?.profileImage;
        break;
      default:
        return null;
    }

    // Return full URL if imagePath exists
    return imagePath
      ? imagePath.startsWith("http")
        ? imagePath
        : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${imagePath}`
      : null;
  };

  const getDisplayName = () => {
    switch (user?.role) {
      case "FARMER":
        return user?.farmerProfile
          ? `${user.farmerProfile.firstName} ${user.farmerProfile.lastName}`
          : user?.username;
      case "PROCESSOR":
        return user?.processorProfile?.contactPerson || user?.username;
      case "ADMIN":
        return user?.adminProfile
          ? `${user.adminProfile.firstName} ${user.adminProfile.lastName}`
          : user?.username;
      default:
        return user?.username;
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Enhanced Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Sidebar Header with Logo */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 ${roleColors.bg} rounded-lg flex items-center justify-center`}
              >
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className={`text-xl font-bold ${roleColors.text}`}>
                Plancana
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search batches, farms..."
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${roleColors.ring} focus:border-transparent text-sm`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {user?.role} DASHBOARD
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {currentNavItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? roleColors.active
                    : `text-gray-600 ${roleColors.hover} hover:text-gray-900`
                }`}
              >
                <IconComponent className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Enhanced User Profile Section at Bottom */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              <img
                src={getProfileImage() || "/default-avatar.png"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
          </div>

          {/* Quick Profile Actions */}
          <div className="space-y-1">
            <Link
              href={`/${user?.role?.toLowerCase()}/profile`}
              className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
            >
              <User className="mr-2 h-3.5 w-3.5" />
              <span>Manage Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Menu Button */}
        <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        {/* Main Content */}
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

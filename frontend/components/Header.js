/**
 * Header Component
 * Navigation bar with user menu and logout functionality
 */
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  ChevronDown,
  Activity,
} from "lucide-react";

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/", current: router.pathname === "/" },
    {
      name: "Applications",
      href: "/applications",
      current: router.pathname === "/applications",
    },
    {
      name: "Metrics",
      href: "/metrics",
      current: router.pathname === "/metrics",
    },
    { name: "Logs", href: "/logs", current: router.pathname === "/logs" },
    { name: "Alerts", href: "/alerts", current: router.pathname === "/alerts" },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white">
                Big Brother
              </span>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? "border-blue-500 text-white"
                      : "border-transparent text-gray-300 hover:text-white hover:border-gray-300"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>

          {/* User menu */}
          <div className="flex items-center">
            {/* Desktop user menu */}
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <div className="ml-3 relative" ref={userMenuRef}>
                <div>
                  <button
                    type="button"
                    className="bg-gray-800 rounded-full flex text-sm ring-2 ring-transparent hover:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-all duration-200"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <p className="font-medium">{user?.username || "User"}</p>
                      <p className="text-xs text-gray-500">
                        {user?.role || "Administrator"}
                      </p>
                    </div>

                    <a
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <User className="mr-3 h-4 w-4" />
                      Your Profile
                    </a>

                    <a
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </a>

                    <a
                      href="/admin"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Shield className="mr-3 h-4 w-4" />
                      Admin Panel
                    </a>

                    <div className="border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-700">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`${
                  item.current
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-600 hover:text-white"
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Mobile user menu */}
          <div className="pt-4 pb-3 border-t border-gray-600">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">
                  {user?.username || "User"}
                </div>
                <div className="text-sm font-medium leading-none text-gray-400">
                  {user?.role || "Administrator"}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <a
                href="/profile"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200"
              >
                <User className="mr-3 h-5 w-5" />
                Your Profile
              </a>
              <a
                href="/settings"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200"
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </a>
              <a
                href="/admin"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200"
              >
                <Shield className="mr-3 h-5 w-5" />
                Admin Panel
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

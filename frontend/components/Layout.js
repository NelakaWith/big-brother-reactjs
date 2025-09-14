/**
 * Layout Component
 * Main layout wrapper with authentication and navigation
 */
import { useAuth } from "../hooks/useAuth";
import Header from "./Header";
import PrivateRoute from "./PrivateRoute";

const Layout = ({ children, requireAuth = true }) => {
  const { isAuthenticated, loading, initialized } = useAuth();

  // For pages that don't require authentication (like login)
  if (!requireAuth) {
    return <div className="min-h-screen bg-gray-900">{children}</div>;
  }

  // For protected pages
  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-900">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </PrivateRoute>
  );
};

export default Layout;

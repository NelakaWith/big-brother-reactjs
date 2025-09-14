/**
 * Private Route Component
 * Protects pages that require authentication
 */
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized || loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const currentPath = router.asPath;
      // Don't redirect if already on login page
      if (currentPath !== "/login") {
        console.log("PrivateRoute: Redirecting to login, not authenticated");
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [isAuthenticated, loading, initialized, router]);

  // Show loading spinner while checking authentication
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>{!initialized ? "Initializing..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Render the protected component
  return children;
};

export default PrivateRoute;

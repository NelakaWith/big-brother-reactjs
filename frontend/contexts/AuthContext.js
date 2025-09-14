/**
 * Authentication Context
 * Manages JWT authentication state, login/logout, and token refresh
 */
import { createContext, useContext, useReducer, useEffect } from "react";

// Authentication state management
const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_LOADING: "SET_LOADING",
};

// Authentication reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
      };

    case AUTH_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: "bb_access_token",
  REFRESH_TOKEN: "bb_refresh_token",
  USER: "bb_user",
};

// API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Authentication provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication from localStorage
  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialize authentication state from stored tokens
  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const userData = localStorage.getItem(STORAGE_KEYS.USER);

      if (accessToken && refreshToken && userData) {
        // Verify token is still valid
        const isValid = await verifyToken(accessToken);

        if (isValid) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              accessToken,
              refreshToken,
              user: JSON.parse(userData),
            },
          });
        } else {
          // Try to refresh token
          const refreshed = await refreshAccessToken(refreshToken);
          if (refreshed) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken || refreshToken,
                user: JSON.parse(userData),
              },
            });

            // Update stored tokens
            localStorage.setItem(
              STORAGE_KEYS.ACCESS_TOKEN,
              refreshed.accessToken
            );
            if (refreshed.refreshToken) {
              localStorage.setItem(
                STORAGE_KEYS.REFRESH_TOKEN,
                refreshed.refreshToken
              );
            }
          } else {
            // Clear invalid tokens
            clearStoredAuth();
          }
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      clearStoredAuth();
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Login function
  const login = async (username, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store tokens and user data
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (refreshToken) {
        // Notify server about logout
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear local state regardless of API call result
      clearStoredAuth();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Verify token validity
  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data.success && data.valid;
    } catch (error) {
      console.error("Token verification error:", error);
      return false;
    }
  };

  // Refresh access token
  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({
          type: AUTH_ACTIONS.TOKEN_REFRESH,
          payload: { accessToken: data.accessToken },
        });

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }

        return {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }

      return null;
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    }
  };

  // Clear stored authentication data
  const clearStoredAuth = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  // Get current access token
  const getAccessToken = () => {
    return state.accessToken || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    login,
    logout,
    clearError,
    getAccessToken,
    refreshAccessToken: () => refreshAccessToken(state.refreshToken),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;

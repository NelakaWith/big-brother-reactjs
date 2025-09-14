import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import {
  loginUser,
  logoutUser,
  clearError,
  forceLogout,
  selectAuth,
  selectIsAuthenticated,
  selectUser,
  selectAccessToken,
  selectAuthLoading,
  selectAuthError,
  selectAuthInitialized,
} from "../store/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();

  // Selectors
  const auth = useSelector(selectAuth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const accessToken = useSelector(selectAccessToken);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const initialized = useSelector(selectAuthInitialized);

  // Actions
  const login = useCallback(
    async (username, password) => {
      const result = await dispatch(loginUser({ username, password }));
      return {
        success: !result.error,
        error: result.error?.message || result.payload,
      };
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const forceLogoutAction = useCallback(() => {
    dispatch(forceLogout());
  }, [dispatch]);

  const getAccessToken = useCallback(() => {
    return accessToken || localStorage.getItem("bb_access_token");
  }, [accessToken]);

  return {
    // State
    isAuthenticated,
    user,
    accessToken,
    loading,
    error,
    initialized,

    // Actions
    login,
    logout,
    clearError: clearAuthError,
    forceLogout: forceLogoutAction,
    getAccessToken,
  };
};

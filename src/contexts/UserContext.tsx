import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "../types/models";
import { authApi } from "../utils/api";
import api from "../utils/api";
import {
  getCurrentUser,
  getUserPermissions,
  setUserProfile,
  removeToken,
  isLoggedIn,
  setToken,
} from "../utils/auth";

interface UserContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  mustChangePassword: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: User["role"]) => boolean;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const refreshProfile = async () => {
    try {
      if (!isLoggedIn()) {
        setUser(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      const profile = await authApi.getProfile();
      setUser(profile.user);
      setPermissions(profile.permissions);
      setUserProfile(profile);
      setMustChangePassword(profile.user.mustChangePassword || false);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // If profile fetch fails, likely invalid token
      removeToken();
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await authApi.login(credentials);
      setToken(response.token);

      // Fetch user profile after login
      await refreshProfile();
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Silently handle logout errors - user is logging out anyway
      console.warn("Logout API call failed:", error);
    } finally {
      // Always clear local state regardless of API response
      removeToken();
      setUser(null);
      setPermissions([]);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasRole = (role: User["role"]): boolean => {
    return user?.role === role;
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      // Refresh profile to update mustChangePassword flag
      await refreshProfile();
    } catch (error: any) {
      throw new Error(error.message || "Failed to change password");
    }
  };

  useEffect(() => {
    // Initialize user state from localStorage if available
    const storedUser = getCurrentUser();
    const storedPermissions = getUserPermissions();

    if (storedUser && storedPermissions && isLoggedIn()) {
      setUser(storedUser);
      setPermissions(storedPermissions);
      // Still refresh profile to ensure it's current
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const value: UserContextType = {
    user,
    permissions,
    loading,
    mustChangePassword,
    login,
    logout,
    refreshProfile,
    hasPermission,
    hasRole,
    changePassword,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

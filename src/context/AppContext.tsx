import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api } from "../services/api";
import { User } from "../types";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface AppContextProps {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (token: string, user: any) => void;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage["type"]) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("crm_token"));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage["type"] = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch user profile on mount if token exists
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
          setIsAuthenticated(true);
        } catch (e: any) {
          console.error("Failed to authenticate session:", e);
          // Token is stale or invalid, remove it
          localStorage.removeItem("crm_token");
          setToken(null);
          setIsAuthenticated(false);
          setUser(null);
          showToast("Your session has expired. Please log in again.", "warning");
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, [token, showToast]);

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      localStorage.setItem("crm_token", res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      showToast(`Welcome back, ${res.user.name}!`, "success");
    } catch (e: any) {
      showToast(e.message || "Failed to log in", "error");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem("crm_token", res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
      showToast("Account registered successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to register account", "error");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useCallback((token: string, user: any) => {
    localStorage.setItem("crm_token", token);
    setToken(token);
    setUser(user);
    setIsAuthenticated(true);
    showToast(`Welcome back, ${user.name}!`, "success");
  }, [showToast]);

  const logout = useCallback(() => {
    localStorage.removeItem("crm_token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    showToast("Signed out successfully", "info");
  }, [showToast]);

  const updateProfile = async (data: any) => {
    try {
      const res = await api.updateUserProfile(data);
      setUser(res.user);
      showToast("Profile updated successfully", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to update profile", "error");
      throw e;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

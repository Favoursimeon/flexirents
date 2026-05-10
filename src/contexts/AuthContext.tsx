import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      api.get("/api/users/profile")
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem("access_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;
    try {
      const res = await api.post("/api/auth/register", { email, password, firstName, lastName });
      localStorage.setItem("access_token", res.data.accessToken);
      localStorage.setItem("refresh_token", res.data.refreshToken);
      const profile = await api.get("/api/users/profile");
      setUser(profile.data);
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data || "Registration failed" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("access_token", res.data.accessToken);
      localStorage.setItem("refresh_token", res.data.refreshToken);
      const profile = await api.get("/api/users/profile");
      setUser(profile.data);
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data || "Login failed" };
    }
  };

  const signOut = async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      await api.post("/api/auth/resend-verification", { email });
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data || "Failed to resend email" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default AuthContext;
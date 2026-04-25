"use client";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import axiosClient from "@/lib/axios-client";

// Define the User type
interface User {
  _id: string;
  userName: string;
  brandName: string;
  location: string;
  phone: string;
  logo?: string;
  email?: string;
}

// Define the AuthContext type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  signIn: (
    email: string,
    password: string,
    setIsLoading: (value: boolean) => void,
    setMessage: (message: { type: string; message: string }) => void,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

// Create context with default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize authentication state from cookies
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = Cookies.get("user");

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser) as User;
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error reading user cookie:", error);
        Cookies.remove("user");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Protected routes - require authentication
    const protectedRoutes = ["/dashboard"];
    const isProtectedRoute = protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    // Auth routes - redirect if already authenticated
    const authRoutes = ["/pages/signin", "/pages/signup"];
    const isAuthRoute = authRoutes.some((route) => pathname === route);

    if (!isAuthenticated && isProtectedRoute) {
      router.push("/pages/signin");
    } else if (isAuthenticated && (pathname === "/" || isAuthRoute)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, pathname, loading, router]);

  const signIn = async (
    email: string,
    password: string,
    setIsLoading: (value: boolean) => void,
    setMessage: (message: { type: string; message: string }) => void,
  ) => {
    try {
      setIsLoading(true);
      const params = { email, password };

      // withCredentials: true allows the server to set HTTP-only cookies
      const { data } = await axiosClient.post("/auth/login", params);

      setMessage({ type: "success", message: "تم تسجيل الدخول بنجاح" });
      setIsAuthenticated(true);
      setUser(data.user);

      // Store user data in a regular cookie (token is in HTTP-only cookie managed by server)
      Cookies.set("user", JSON.stringify(data.user), {
        expires: 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      router.push("/dashboard");
    } catch (error: any) {
      if (error.response) {
        setMessage({ type: "error", message: error.response.data.message });
      } else {
        setMessage({ type: "error", message: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Call logout endpoint to clear HTTP-only cookie on server
      await axiosClient.post("/auth/logout", {});
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("user", { path: "/" });
      setUser(null);
      setIsAuthenticated(false);
      router.push("/pages/signin");
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    setIsAuthenticated,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// context/auth-context.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface UserData {
  name: string;
  email: string;
  isAdmin: boolean;
  token: string;
  role: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoginOpen: boolean;
  login: (userData: UserData) => void;
  logout: () => void;
  openLogin: () => void;
  closeLogin: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      const token = localStorage.getItem("authToken");
      const userData = localStorage.getItem("userData");
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser({
            name: parsedUser.name,
            email: parsedUser.email,
            token: token,
            isAdmin: parsedUser.role === "admin",
            role: parsedUser.role
          });
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
      setIsLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const login = (userData: UserData) => {
    console.log('=== AUTH CONTEXT LOGIN ===');
    console.log('Received userData:', userData);
    console.log('Role from userData:', userData.role);
    console.log('Is admin check:', userData.role === "admin");
    
    const userWithAdmin = {
      name: userData.name,
      email: userData.email,
      token: userData.token,
      isAdmin: userData.role === "admin",
      role: userData.role
    };
    
    console.log('Final user object:', userWithAdmin);
    console.log('Final role:', userWithAdmin.role);
    console.log('Final isAdmin:', userWithAdmin.isAdmin);
    
    setUser(userWithAdmin);
    
    // Store in localStorage
    localStorage.setItem("authToken", userData.token);
    localStorage.setItem("userData", JSON.stringify({
      name: userData.name,
      email: userData.email,
      role: userData.role
    }));
    
    setIsLoginOpen(false);
  };

  const logout = () => {
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoginOpen,
        login,
        logout,
        openLogin: () => setIsLoginOpen(true),
        closeLogin: () => setIsLoginOpen(false),
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
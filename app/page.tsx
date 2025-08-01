"use client";

import { Navbar } from "@/components/navbar";
import DiamondManagement from "../diamond-management";
import { LoginDialog } from "@/components/pages/login-dialog";
import { useAuth } from "@/context/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Page() {
  const { 
    user, 
    isLoginOpen, 
    openLogin, 
    closeLogin 
  } = useAuth();

  return (
    <>
      
      <DiamondManagement />

      <LoginDialog 
      open={isLoginOpen} 
      onOpenChange={(open: boolean) => open ? openLogin() : closeLogin()} 
      />
    </>
  );
}
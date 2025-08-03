"use client";
import DiamondManagement from "../diamond-management";
import { LoginDialog } from "@/components/pages/login-dialog";
import { useAuth } from "@/context/auth-context";

export default function Page() {
  const {  
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
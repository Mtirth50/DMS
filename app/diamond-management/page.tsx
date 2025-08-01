"use client";
import { useState } from "react"
import { Diamond } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TabSection from "@/components/TabSection"; // adjust path if needed
import { Navbar } from "@/components/navbar";

interface UserData {
  name: string
  isAdmin: boolean
  // Add other fields as needed
}
export default function DiamondManagementPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [user, setUser] = useState<UserData | null>(null)
  
    
    const handleLogin = (userData: UserData) => {
      setUser(userData)
      setIsLoginOpen(false)
    }
      // Clear error when user starts typing
      
  
    
  
    const handleLogout = () => {
      setUser(null)
    }
  
    function handleNavigation(page: string): void {
      // For now, simply log the navigation action.
      // In a real app, you might use a router to navigate to different pages.
      console.log(`Navigating to: ${page}`)
    }
  return (
    <>
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Diamond className="h-6 w-6" />
              હીરાની માહિતી વ્યવસ્થાપન
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TabSection />
          </CardContent>
        </Card>
      </div>
    </div>
    </>
    
  );
}

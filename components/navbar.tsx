"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  BarChart3,
  Menu,
  User,
  LogOut,
  Settings,
  Diamond,
  Users,
  Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { LoginDialog } from "@/components/pages/login-dialog";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isLoginOpen, openLogin, logout, closeLogin } = useAuth();
  


  const navigationItems = [
    { id: "home", label: "હોમ", icon: Home },
    
    { id: "diamond-management", label: "દિમાંડ મેનેજમેન્ટ", icon: Diamond },
  ];

  const adminItems = [
    { id: "dashboard", label: "ડેશબોર્ડ", icon: BarChart3 },
    { id: "admin/users", label: "યુઝર મેનેજમેન્ટ", icon: Users },
  ];

  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
    setIsMobileMenuOpen(false);
    console.log("user", user);
    console.log("role",user?.role);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Test function for debugging
 

  

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Diamond className="h-8 w-8 text-blue-600" />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">હીરા વ્યવસ્થાપન</h1>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigation(item.id)}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              {user?.role === "admin" &&
                adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNavigation(item.id)}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
            </div>

            <div className="flex items-center space-x-2">
              {user && (
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">3</Badge>
                </Button>
              )}

              {!user ? (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={openLogin}>
                    <User className="h-4 w-4 mr-2" />
                    લોગિન
                  </Button>
                  <Button size="sm" onClick={openLogin}>
                    સાઇન અપ
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user.name} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.role === "admin" ? "એડમિનિસ્ટ્રેટર" : "યુઝર"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {user.role === "admin" &&
                      adminItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            className="cursor-pointer"
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                          </DropdownMenuItem>
                        );
                      })}

                    {user.role === "admin" && <DropdownMenuSeparator />}

                    <DropdownMenuItem onClick={() => handleNavigation("profile")} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>પ્રોફાઇલ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigation("settings")} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>સેટિંગ્સ</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>લોગ આઉટ</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">મેન્યુ ખોલો</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                      <Diamond className="h-6 w-6 text-blue-600" />
                      <span>હીરા વ્યવસ્થાપન</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleNavigation(item.id)}
                          >
                            <Icon className="mr-3 h-4 w-4" />
                            {item.label}
                          </Button>
                        );
                      })}
                    </div>

                    {user?.role === "admin" && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          એડમિન પેનલ
                        </h3>
                        {adminItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Button
                              key={item.id}
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleNavigation(item.id)}
                            >
                              <Icon className="mr-3 h-4 w-4" />
                              {item.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t">
                      {!user ? (
                        <div className="space-y-2">
                          <Button className="w-full" onClick={openLogin}>
                            <User className="mr-2 h-4 w-4" />
                            લોગિન
                          </Button>
                          <Button variant="outline" className="w-full bg-transparent" onClick={openLogin}>
                            સાઇન અપ
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user.name} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.role === "admin" ? "એડમિનિસ્ટ્રેટર" : "યુઝર"}</p>
                            </div>
                          </div>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation("profile")}>
                            <User className="mr-3 h-4 w-4" />
                            પ્રોફાઇલ
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            લોગ આઉટ
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <LoginDialog open={isLoginOpen} onOpenChange={closeLogin} />
    </>
  );
}

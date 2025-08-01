"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, Diamond } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export type UserData = {
  name: string;
  email: string;
  isAdmin: boolean;
  token: string;
  role: string;
};

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    isAdmin: false,
  });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!loginData.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!loginData.password) {
      newErrors.password = "Password is required";
    } else if (loginData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    
    try {
      
      const response = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
        }),
      });

      const data = await response.json();
      // Extract role from user object
      const actualRole = data.user?.role || "user";
      
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      else{
        localStorage.setItem('authToken', data.token);
      }

      
      login({
        name: data.user?.username || loginData.username,
        email: data.user?.email || "",
        isAdmin: actualRole === "admin",
        role: actualRole, 
        token: data.token
      });

      if (loginData.rememberMe) {
        localStorage.setItem("rememberedUsername", loginData.username);
      }

      setLoginData({
        username: "",
        password: "",
        rememberMe: false,
      });
      setErrors({});
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrors({ 
        form: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!signupData.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!signupData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(signupData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!signupData.password) {
      newErrors.password = "Password is required";
    } else if (signupData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    
    try {      
      const response = await fetch("http://localhost:4000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupData.username,
          email: signupData.email,
          password: signupData.password,
          role: signupData.isAdmin ? "admin" : "user",
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      else{
        localStorage.setItem('authToken', data.token);
      }

      
      login({
        name: data.username || signupData.username,
        email: data.email || signupData.email,
        isAdmin: data.role === "admin",
        role: data.role || (signupData.isAdmin ? "admin" : "user"), 
        token: data.token
      });

      setSignupData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        isAdmin: false,
      });
      setErrors({});
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      setErrors({ 
        form: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center space-x-2">
            <Diamond className="h-6 w-6 text-blue-600" />
            <span>Diamond Management System</span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Log in to your account or create a new one
          </DialogDescription>
        </DialogHeader>

        {errors.form && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value as "login" | "signup");
            setErrors({});
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                placeholder="Enter your username"
                value={loginData.username}
                onChange={(e) => setLoginData({
                  ...loginData,
                  username: e.target.value
                })}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({
                    ...loginData,
                    password: e.target.value
                  })}
                  className={errors.password ? "border-red-500" : ""}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={loginData.rememberMe}
                  onCheckedChange={(checked) => setLoginData({
                    ...loginData,
                    rememberMe: Boolean(checked)
                  })}
                />
                <Label htmlFor="remember-me" className="text-sm">
                  Remember me
                </Label>
              </div>
              <Button variant="link" className="text-sm h-auto p-0">
                Forgot password?
              </Button>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                placeholder="Enter your username"
                value={signupData.username}
                onChange={(e) => setSignupData({
                  ...signupData,
                  username: e.target.value
                })}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={(e) => setSignupData({
                  ...signupData,
                  email: e.target.value
                })}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                value={signupData.password}
                onChange={(e) => setSignupData({
                  ...signupData,
                  password: e.target.value
                })}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({
                  ...signupData,
                  confirmPassword: e.target.value
                })}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="admin-account"
                checked={signupData.isAdmin}
                onCheckedChange={(checked) => setSignupData({
                  ...signupData,
                  isAdmin: Boolean(checked)
                })}
              />
              <Label htmlFor="admin-account" className="text-sm">
                Create admin account
              </Label>
            </div>

            <Button 
              onClick={handleSignup} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
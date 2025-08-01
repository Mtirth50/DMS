"use client";
import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/navbar";
import { usePathname } from "next/navigation";
import ClientNavbarWrapper from "@/components/ClientNavbarWrapper";
//import 'bootstrap/dist/css/bootstrap.min.css';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


interface UserData {
  name: string
  isAdmin: boolean
  // Add other fields as needed
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNavbar = [
    "/home",
    "/diamond-management",
    "/"
    // "/login", // Uncomment if you want navbar on login page
  ].includes(pathname);
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        
        <AuthProvider>
          <ClientNavbarWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
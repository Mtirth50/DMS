"use client";
import { usePathname } from "next/navigation";
import {Navbar } from "@/components/navbar";

const NAVBAR_PATHS = ["/", "/home", "/diamond-management"]; // Add more as needed

export default function ClientNavbarWrapper() {
  const pathname = usePathname();
  if (!NAVBAR_PATHS.includes(pathname)) return null;
  return <Navbar />;
}
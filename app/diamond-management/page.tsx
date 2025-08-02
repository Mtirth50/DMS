"use client";
import { Diamond } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TabSection from "@/components/TabSection";

export default function DiamondManagementPage() {
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

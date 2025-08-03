'use client';

import { useState } from 'react';
import {
  Diamond,
  Award,
  DollarSign,
  Package,
  Users,
  CheckCircle,
} from 'lucide-react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { DiamondDetailsForm } from './forms/DiamondDetailsForm';
import { FormProvider } from '@/context/FormContext';
import { OfficeProcessingForm } from './forms/OfficeProcessingForm';
import { FinalDiamondform } from './forms/FinalDiamondform';
import TransactionForm from './forms/TransactionForm';
import { DiamondProcessingTabs } from './ProcessingTabs';

export default function TabSection() {
  const [activeTab, setActiveTab] = useState('diamond-details');
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set());

  const tabs = [
    { id: 'diamond-details', label: 'રફ ડાયમંડ ઉમેરો', icon: Diamond },
    { id: 'certification', label: 'પ્રોસેસિંગ', icon: Award },
    { id: 'pricing', label: 'ઓફિસ પ્રોસેસિંગ', icon: DollarSign },
    { id: 'inventory', label: 'ફાઇનલ ડાયમંડ', icon: Package },
    { id: 'supplier', label: 'કોન્ટેક્ટ્સ મેનેજ કરો', icon: Users }
  ];

  // Function to mark a tab as complete
  const markTabComplete = (tabId: string) => {
    setCompletedTabs((prev) => new Set(prev).add(tabId));
  };

  return (
    <Card className="p-2">
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-2 text-xs relative"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {completedTabs.has(tab.id) && (
                    <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="diamond-details">
            <div className="p-2 border rounded bg-gray-50">
              <FormProvider>
              <DiamondDetailsForm markTabComplete={markTabComplete} />
              </FormProvider>
            </div>
          </TabsContent>

          <TabsContent value="certification">
            <DiamondProcessingTabs/>
          </TabsContent>

          <TabsContent value="pricing">
            <FormProvider>
              <OfficeProcessingForm />
              </FormProvider>
          </TabsContent>
          <TabsContent value="inventory">
              <FormProvider>
                 <FinalDiamondform/>
              </FormProvider>
          </TabsContent>

          <TabsContent value="supplier">
            <FormProvider>
            <TransactionForm/>
            </FormProvider>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

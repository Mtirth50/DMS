'use client';

import { Diamond, Package, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <Diamond className="h-20 w-20 text-blue-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          હીરા વ્યવસ્થાપન સિસ્ટમ
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ઇન્વેન્ટરી વ્યવસ્થાપન</h3>
              <p className="text-gray-600">સંપૂર્ણ સ્ટોક ટ્રેકિંગ અને વ્યવસ્થાપન</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">પ્રમાણપત્ર વ્યવસ્થાપન</h3>
              <p className="text-gray-600">GIA, AGS અને અન્ય પ્રમાણપત્રો</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">કિંમત ટ્રેકિંગ</h3>
              <p className="text-gray-600">બજાર મૂલ્ય અને કિંમત વિશ્લેષણ</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <a href="/login" className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
            શરૂ કરો
          </a>
        </div>
      </div>
    </div>
    </>
  );
}

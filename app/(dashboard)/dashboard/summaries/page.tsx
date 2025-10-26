'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';
import CreateSummary from '../../../../components/summaries/CreateSummary';

export default function SummariesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" dir="rtl">
      {/* Header with back button */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                📚 סיכומים
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                סכמי מסמכים וטקסטים בקלות
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateSummary />
      </div>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-pink-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}
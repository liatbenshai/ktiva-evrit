'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';
import CreateStory from '../../../../components/stories/CreateStory';

export default function StoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                📚 סיפורים
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-700">
                כתיבה יצירתית - סיפורים מרתקים בעברית תקנית
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base flex-shrink-0"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">חזרה לדשבורד</span>
              <span className="sm:hidden">דשבורד</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <CreateStory />
      </div>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-orange-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}
'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';
import CreateStory from '../../../../components/stories/CreateStory';

export default function StoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                📚 סיפורים
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                כתיבה יצירתית - סיפורים מרתקים בעברית תקנית
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateStory />
      </div>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-orange-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}
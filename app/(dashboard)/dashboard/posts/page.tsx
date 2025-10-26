'use client';

import { useState } from 'react';
import { Home, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';
import CreatePost from '@/components/posts/CreatePost';

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📱 פוסטים לרשתות חברתיות
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                יצירת תוכן ויראלי מותאם לכל פלטפורמה
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreatePost />
      </div>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-purple-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}
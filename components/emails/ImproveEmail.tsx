'use client';

import { useState } from 'react';
import ImprovementButtons from '@/components/shared/ImprovementButtons';
import AIChatBot from '@/components/ai-correction/AIChatBot';

export default function ImproveEmail() {
  const [email, setEmail] = useState('');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          המייל לשיפור
        </h2>
        
        <textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="הדבק כאן את המייל שברצונך לשפר..."
          rows={12}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
      </div>

      {email.trim() && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🤖 שיפור אוטומטי
          </h3>
          <ImprovementButtons
            content={email}
            documentType="email"
            onImprove={(improved) => setEmail(improved)}
          />
          <p className="mt-3 text-sm text-gray-500">
            בחר את סוג השיפור המבוקש - המערכת תשפר את המייל ותלמד מהעריכות שלך
          </p>
        </div>
      )}

      {/* בוט AI לעזרה */}
      <AIChatBot 
        text={email || ''}
        context="שיפור מייל"
        userId="default-user"
      />
    </div>
  );
}
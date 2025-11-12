'use client';

import { Clock, CheckCircle, PlayCircle, Trophy } from 'lucide-react';

interface LessonCardProps {
  id: string;
  title: string;
  description?: string;
  duration: number;
  topic: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'MASTERED';
  score?: number | null;
}

const statusConfig = {
  NOT_STARTED: {
    label: 'לא התחיל',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    icon: PlayCircle,
  },
  IN_PROGRESS: {
    label: 'בתהליך',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: PlayCircle,
  },
  COMPLETED: {
    label: 'הושלם',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    icon: CheckCircle,
  },
  MASTERED: {
    label: 'שלוט',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Trophy,
  },
};

export default function LessonCard({
  id,
  title,
  description,
  duration,
  topic,
  status = 'NOT_STARTED',
  score,
}: LessonCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
              {topic}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {duration} דק'
            </span>
          </div>
          <h3 className="mb-1 text-lg font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-600">{description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.color} ${config.bgColor}`}>
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </span>
          {score !== null && score !== undefined && (
            <span className="text-sm font-semibold text-slate-700">{score}%</span>
          )}
        </div>
      </div>
    </div>
  );
}


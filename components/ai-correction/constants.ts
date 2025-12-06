// Constants for AI Correction components

import { RevisionLevel, ContentStyle } from './types';

export interface RevisionLevelOption {
  value: RevisionLevel;
  label: string;
  description: string;
}

export interface ContentStyleOption {
  value: ContentStyle;
  label: string;
  description: string;
}

export const revisionLevelOptions: RevisionLevelOption[] = [
  {
    value: 'minimal',
    label: 'מינימלי',
    description: 'רק תיקונים קריטיים',
  },
  {
    value: 'balanced',
    label: 'מאוזן',
    description: 'שיפור משמעותי אך שומר על הסגנון',
  },
  {
    value: 'deep',
    label: 'עמוק',
    description: 'שכתוב עברי טבעי ומלא',
  },
];

export const contentStyleOptions: ContentStyleOption[] = [
  {
    value: 'general',
    label: 'כללי',
    description: 'עברית תקנית ומקצועית',
  },
  {
    value: 'legal',
    label: 'משפטי',
    description: 'ניסוח חוזים וכתיבה פורמלית',
  },
  {
    value: 'academic',
    label: 'אקדמי',
    description: 'סגנון מחקרי ורשמי',
  },
  {
    value: 'marketing',
    label: 'שיווקי',
    description: 'טון משכנע וסוחף',
  },
  {
    value: 'friendly',
    label: 'ידידותי',
    description: 'כתיבה קלילה ושיחית',
  },
];


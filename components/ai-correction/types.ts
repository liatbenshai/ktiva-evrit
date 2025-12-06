// Types for AI Correction components

export interface TranslationIssue {
  type: string;
  original: string;
  suggestion: string;
  confidence: number;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

export interface AnalysisResult {
  issues: TranslationIssue[];
  score: number;
  suggestions: string[];
}

export interface Suggestion {
  text: string;
  explanation?: string;
  tone?: string;
  whenToUse?: string;
}

export interface Alternative {
  text: string;
  explanation?: string;
  context?: string;
}

export interface AppliedPattern {
  from: string;
  to: string;
}

export interface SuggestedPattern {
  badPattern: string;
  goodPattern: string;
  explanation: string;
  context: string;
  confidence: number;
}

export interface Stats {
  totalPatterns: number;
  patternsAppliedCount: number;
  estimatedTimeSavedMinutes: number;
  averageConfidence: number;
  topPatterns?: Array<{
    badPattern: string;
    goodPattern: string;
    occurrences: number;
  }>;
  categoriesBreakdown?: Record<string, number>;
}

export interface BatchResults {
  totalTexts: number;
  totalPatternsFound: number;
  patternsSaved: number;
  averageScore: number;
}

export type RevisionLevel = 'minimal' | 'balanced' | 'deep';
export type ContentStyle = 'general' | 'legal' | 'academic' | 'marketing' | 'friendly';
export type IssueStatus = 'accepted' | 'dismissed' | 'pending';


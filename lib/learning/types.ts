// lib/learning/types.ts

export interface UserEdit {
    id: string;
    userId: string;
    documentType: 'article' | 'script' | 'quote' | 'prompt' | 'email' | 'post' | 'story' | 'summary' | 'protocol';
    originalText: string;
    editedText: string;
    timestamp: Date;
    editType: 'improve' | 'fix' | 'refine' | 'manual';
  }
  
  export interface UserPreference {
    userId: string;
    forbiddenWords: string[]; // מילים להימנעות
    preferredWords: { [key: string]: string }; // מילה → תחליף מועדף
    stylePreferences: {
      tone?: string; // טון כתיבה מועדף
      formality?: 'formal' | 'casual' | 'professional';
      avoidTranslations?: boolean; // הימנע מתרגומים
    };
    commonEdits: { // עריכות נפוצות
      from: string;
      to: string;
      count: number;
    }[];
  }
  
  export interface LearningInsight {
    pattern: string;
    description: string;
    confidence: number; // 0-1
    examples: string[];
  }
/**
 * Advanced Learning System for Hebrew Text Improvement
 * מערכת למידה מתקדמת לשיפור כתיבה עברית
 */

export interface TextCorrection {
  id: string
  originalText: string
  correctedText: string
  correctionType: 'synonym' | 'grammar' | 'style' | 'terminology' | 'context'
  context: string
  category: 'articles' | 'emails' | 'posts' | 'protocols' | 'scripts' | 'stories' | 'summaries' | 'quotes'
  userId: string
  timestamp: Date
  confidence: number
}

export interface LearningPattern {
  pattern: string
  correction: string
  frequency: number
  accuracy: number
  context: string[]
  category: string
}

export interface UserLearningProfile {
  userId: string
  corrections: TextCorrection[]
  patterns: LearningPattern[]
  preferences: {
    formalityLevel: 'formal' | 'semi-formal' | 'informal'
    writingStyle: 'academic' | 'business' | 'creative' | 'technical'
    categoryPreferences: Record<string, number>
  }
  lastUpdated: Date
}

export class HebrewLearningSystem {
  private corrections: TextCorrection[] = []
  private patterns: LearningPattern[] = []
  private userProfiles: Map<string, UserLearningProfile> = new Map()

  /**
   * Record a text correction for learning
   */
  recordCorrection(correction: Omit<TextCorrection, 'id' | 'timestamp'>): void {
    const newCorrection: TextCorrection = {
      ...correction,
      id: this.generateId(),
      timestamp: new Date()
    }

    this.corrections.push(newCorrection)
    this.updateUserProfile(newCorrection)
    this.extractPatterns(newCorrection)
  }

  /**
   * Get improved synonyms based on learning
   */
  getLearnedSynonyms(word: string, userId: string, context: string, category: string): string[] {
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) return []

    // Find patterns that match this word and context
    const relevantPatterns = userProfile.patterns.filter(pattern => 
      pattern.pattern.includes(word) && 
      pattern.context.some(ctx => context.includes(ctx)) &&
      pattern.category === category
    )

    // Sort by accuracy and frequency
    const sortedPatterns = relevantPatterns.sort((a, b) => 
      (b.accuracy * b.frequency) - (a.accuracy * a.frequency)
    )

    return sortedPatterns.map(pattern => pattern.correction)
  }

  /**
   * Analyze text for potential improvements
   */
  analyzeTextForImprovements(text: string, userId: string, context: string, category: string): {
    suggestions: Array<{
      original: string
      suggestion: string
      confidence: number
      reason: string
    }>
    overallScore: number
    categoryScore: number
  } {
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) return { suggestions: [], overallScore: 0, categoryScore: 0 }

    const suggestions: Array<{
      original: string
      suggestion: string
      confidence: number
      reason: string
    }> = []

    // Analyze for common patterns
    for (const pattern of userProfile.patterns) {
      if (text.includes(pattern.pattern) && pattern.category === category) {
        suggestions.push({
          original: pattern.pattern,
          suggestion: pattern.correction,
          confidence: pattern.accuracy,
          reason: `למדתי מהתיקונים שלך (${pattern.frequency} פעמים)`
        })
      }
    }

    // Calculate scores
    const overallScore = this.calculateTextScore(text, userProfile)
    const categoryScore = this.calculateCategoryScore(text, category, userProfile)

    return { suggestions, overallScore, categoryScore }
  }

  /**
   * Get writing suggestions based on user's writing history
   */
  getWritingSuggestions(userId: string, category: string): {
    commonMistakes: Array<{
      mistake: string
      correction: string
      frequency: number
    }>
    styleTips: string[]
    categoryInsights: string[]
  } {
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) return { commonMistakes: [], styleTips: [], categoryInsights: [] }

    // Find common mistakes in this category
    const categoryCorrections = userProfile.corrections.filter(c => c.category === category)
    const mistakeMap = new Map<string, { correction: string, count: number }>()

    categoryCorrections.forEach(correction => {
      const key = `${correction.originalText} -> ${correction.correctedText}`
      if (mistakeMap.has(key)) {
        mistakeMap.get(key)!.count++
      } else {
        mistakeMap.set(key, { correction: correction.correctedText, count: 1 })
      }
    })

    const commonMistakes = Array.from(mistakeMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([mistake, data]) => ({
        mistake: mistake.split(' -> ')[0],
        correction: data.correction,
        frequency: data.count
      }))

    // Generate style tips based on user preferences
    const styleTips = this.generateStyleTips(userProfile, category)

    // Generate category-specific insights
    const categoryInsights = this.generateCategoryInsights(category, userProfile)

    return { commonMistakes, styleTips, categoryInsights }
  }

  /**
   * Update user profile based on correction
   */
  private updateUserProfile(correction: TextCorrection): void {
    const userId = correction.userId
    let profile = this.userProfiles.get(userId)

    if (!profile) {
      profile = {
        userId,
        corrections: [],
        patterns: [],
        preferences: {
          formalityLevel: 'semi-formal',
          writingStyle: 'business',
          categoryPreferences: {}
        },
        lastUpdated: new Date()
      }
    }

    profile.corrections.push(correction)
    profile.lastUpdated = new Date()

    // Update category preferences
    const category = correction.category
    profile.preferences.categoryPreferences[category] = 
      (profile.preferences.categoryPreferences[category] || 0) + 1

    this.userProfiles.set(userId, profile)
  }

  /**
   * Extract learning patterns from correction
   */
  private extractPatterns(correction: TextCorrection): void {
    const words = correction.originalText.split(' ')
    const correctedWords = correction.correctedText.split(' ')

    for (let i = 0; i < words.length; i++) {
      if (words[i] !== correctedWords[i]) {
        const pattern = words[i]
        const correction = correctedWords[i]

        // Find existing pattern or create new one
        let existingPattern = this.patterns.find(p => 
          p.pattern === pattern && p.category === correction.category
        )
        
        if (existingPattern) {
          existingPattern.frequency++
          existingPattern.accuracy = this.calculateAccuracy(existingPattern, correction)
          if (!existingPattern.context.includes(correction.context)) {
            existingPattern.context.push(correction.context)
          }
        } else {
          this.patterns.push({
            pattern,
            correction,
            frequency: 1,
            accuracy: 1.0,
            context: [correction.context],
            category: correction.category
          })
        }
      }
    }
  }

  /**
   * Calculate accuracy of a pattern
   */
  private calculateAccuracy(pattern: LearningPattern, newCorrection: string): number {
    const totalCorrections = pattern.frequency
    const correctCorrections = pattern.correction === newCorrection ? 1 : 0
    return correctCorrections / totalCorrections
  }

  /**
   * Calculate text score based on user preferences
   */
  private calculateTextScore(text: string, profile: UserLearningProfile): number {
    let score = 0
    const { preferences } = profile

    // Check formality level
    if (preferences.formalityLevel === 'formal') {
      const formalWords = ['מכובד', 'בכבוד רב', 'בהתאם לחוק']
      score += formalWords.filter(word => text.includes(word)).length * 10
    }

    // Check writing style
    if (preferences.writingStyle === 'academic') {
      const academicWords = ['מחקר', 'תוצאות', 'השערה', 'ניתוח']
      score += academicWords.filter(word => text.includes(word)).length * 15
    }

    return Math.min(100, score)
  }

  /**
   * Calculate category-specific score
   */
  private calculateCategoryScore(text: string, category: string, profile: UserLearningProfile): number {
    const categoryCorrections = profile.corrections.filter(c => c.category === category)
    if (categoryCorrections.length === 0) return 50

    // Calculate based on successful patterns in this category
    const categoryPatterns = profile.patterns.filter(p => p.category === category)
    const successfulPatterns = categoryPatterns.filter(p => p.accuracy > 0.7)
    
    return Math.min(100, (successfulPatterns.length / categoryPatterns.length) * 100)
  }

  /**
   * Generate style tips based on user profile
   */
  private generateStyleTips(profile: UserLearningProfile, category: string): string[] {
    const tips: string[] = []
    
    // Based on common mistakes
    const categoryCorrections = profile.corrections.filter(c => c.category === category)
    const commonMistakes = this.getCommonMistakes(categoryCorrections)
    
    if (commonMistakes.length > 0) {
      tips.push(`נסה להימנע מ: ${commonMistakes.slice(0, 3).join(', ')}`)
    }

    // Based on preferences
    if (profile.preferences.formalityLevel === 'formal') {
      tips.push('השתמש במילים פורמליות יותר כמו "מכובד" במקום "שלום"')
    }

    if (profile.preferences.writingStyle === 'academic') {
      tips.push('הוסף יותר מילים אקדמיות כמו "מחקר", "ניתוח", "תוצאות"')
    }

    return tips
  }

  /**
   * Generate category-specific insights
   */
  private generateCategoryInsights(category: string, profile: UserLearningProfile): string[] {
    const insights: string[] = []
    
    switch (category) {
      case 'articles':
        insights.push('במאמרים, השתמש במילים מקצועיות ומדויקות')
        insights.push('הוסף קישורים בין פסקאות עם מילים כמו "בנוסף", "לפיכך"')
        break
      case 'emails':
        insights.push('באימיילים עסקיים, התחל עם "מכובד" וסיים עם "בכבוד"')
        insights.push('היה קצר וברור - השתמש במילים ישירות')
        break
      case 'posts':
        insights.push('בפוסטים ברשתות חברתיות, השתמש במילים מעוררות השראה')
        insights.push('הוסף קריאות לפעולה עם מילים כמו "הצטרפו", "שתפו"')
        break
      case 'scripts':
        insights.push('בתסריטים, השתמש בדיאלוג טבעי ומילים מדוברות')
        insights.push('הוסף תיאורי פעולה עם מילים דינמיות')
        break
    }

    return insights
  }

  /**
   * Get common mistakes from corrections
   */
  private getCommonMistakes(corrections: TextCorrection[]): string[] {
    const mistakeCount = new Map<string, number>()
    
    corrections.forEach(correction => {
      const mistake = correction.originalText
      mistakeCount.set(mistake, (mistakeCount.get(mistake) || 0) + 1)
    })

    return Array.from(mistakeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mistake]) => mistake)
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Get user learning statistics
   */
  getUserStats(userId: string): {
    totalCorrections: number
    patternsLearned: number
    accuracy: number
    improvementTrend: 'improving' | 'stable' | 'declining'
    categoryStats: Record<string, { corrections: number, accuracy: number }>
  } {
    const profile = this.userProfiles.get(userId)
    if (!profile) {
      return {
        totalCorrections: 0,
        patternsLearned: 0,
        accuracy: 0,
        improvementTrend: 'stable',
        categoryStats: {}
      }
    }

    const totalCorrections = profile.corrections.length
    const patternsLearned = profile.patterns.length
    const accuracy = profile.patterns.reduce((sum, pattern) => sum + pattern.accuracy, 0) / patternsLearned || 0

    // Calculate improvement trend
    const recentCorrections = profile.corrections.slice(-10)
    const olderCorrections = profile.corrections.slice(-20, -10)
    
    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (recentCorrections.length > 0 && olderCorrections.length > 0) {
      const recentAccuracy = recentCorrections.reduce((sum, c) => sum + c.confidence, 0) / recentCorrections.length
      const olderAccuracy = olderCorrections.reduce((sum, c) => sum + c.confidence, 0) / olderCorrections.length
      
      if (recentAccuracy > olderAccuracy + 0.1) improvementTrend = 'improving'
      else if (recentAccuracy < olderAccuracy - 0.1) improvementTrend = 'declining'
    }

    // Calculate category stats
    const categoryStats: Record<string, { corrections: number, accuracy: number }> = {}
    const categories = ['articles', 'emails', 'posts', 'protocols', 'scripts', 'stories', 'summaries', 'quotes']
    
    categories.forEach(category => {
      const categoryCorrections = profile.corrections.filter(c => c.category === category)
      const categoryPatterns = profile.patterns.filter(p => p.category === category)
      const categoryAccuracy = categoryPatterns.reduce((sum, pattern) => sum + pattern.accuracy, 0) / categoryPatterns.length || 0
      
      categoryStats[category] = {
        corrections: categoryCorrections.length,
        accuracy: categoryAccuracy
      }
    })

    return {
      totalCorrections,
      patternsLearned,
      accuracy,
      improvementTrend,
      categoryStats
    }
  }
}

// Global instance
export const learningSystem = new HebrewLearningSystem()

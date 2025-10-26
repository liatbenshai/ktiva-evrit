import { NextRequest, NextResponse } from 'next/server'
import { generateSynonymVersions, analyzeTextQuality } from '@/lib/synonyms'

/**
 * POST /api/synonyms - Generate synonym versions of text
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      text, 
      count = 3, 
      context = '', 
      category = 'general',
      userId = 'default-user'
    } = body

    // Validate required fields
    if (!text) {
      return NextResponse.json(
        { error: 'חסר טקסט לעיבוד' },
        { status: 400 }
      )
    }

    // Generate synonym versions
    const synonymVersions = generateSynonymVersions(text, count, context, category)
    
    // Analyze text quality
    const qualityAnalysis = analyzeTextQuality(text, context)

    return NextResponse.json({
      message: `נוצרו ${synonymVersions.length} גרסאות עם מילים נרדפות`,
      versions: synonymVersions.map((version, index) => ({
        id: `version-${index + 1}`,
        content: version,
        title: `גרסה ${index + 1} - מילים נרדפות`,
        improvements: qualityAnalysis.suggestions.slice(0, 3) // Top 3 suggestions
      })),
      originalText: text,
      qualityAnalysis: {
        score: qualityAnalysis.score,
        suggestions: qualityAnalysis.suggestions
      },
      metadata: {
        context,
        category,
        userId,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating synonym versions:', error)
    return NextResponse.json(
      { error: 'שגיאה ביצירת גרסאות עם מילים נרדפות' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/synonyms - Get synonym suggestions for specific words
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')
    const context = searchParams.get('context') || ''
    const category = searchParams.get('category') || 'general'

    if (!word) {
      return NextResponse.json(
        { error: 'חסרה מילה לחיפוש מילים נרדפות' },
        { status: 400 }
      )
    }

    // Import the synonyms function
    const { getSynonyms } = await import('@/lib/synonyms')
    const synonyms = getSynonyms(word, context, category)

    return NextResponse.json({
      word,
      synonyms,
      context,
      category,
      count: synonyms.length
    })
  } catch (error) {
    console.error('Error getting synonyms:', error)
    return NextResponse.json(
      { error: 'שגיאה בחיפוש מילים נרדפות' },
      { status: 500 }
    )
  }
}

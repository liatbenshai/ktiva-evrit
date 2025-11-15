import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL is not set')
      return NextResponse.json({ 
        success: true, 
        entries: [] // Return empty array instead of error
      })
    }

    let prisma
    try {
      const { prisma: prismaClient } = await import('@/lib/prisma')
      prisma = prismaClient
    } catch (error) {
      console.error('Failed to import Prisma:', error)
      return NextResponse.json({ 
        success: true, 
        entries: [] // Return empty array instead of error
      })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || 'default-user'
    const targetLanguage = searchParams.get('targetLanguage')

    if (!prisma) {
      return NextResponse.json({ 
        success: true, 
        entries: [] // Return empty array instead of error
      })
    }

    const entries = await prisma.languageEntry.findMany({
      where: {
        userId,
        ...(targetLanguage ? { targetLanguage } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 50,
    })

    const parsedEntries = entries.map((entry) => {
      try {
        return {
          ...entry,
          usageExamples: entry.usageExamples ? JSON.parse(entry.usageExamples) : [],
          extraSuggestions: entry.extraSuggestions ? JSON.parse(entry.extraSuggestions) : [],
        }
      } catch (parseError) {
        // If JSON parsing fails, return entry without parsed fields
        return {
          ...entry,
          usageExamples: [],
          extraSuggestions: [],
        }
      }
    })

    return NextResponse.json({ success: true, entries: parsedEntries })
  } catch (error: any) {
    console.error('Failed to list language entries:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    
    // Return empty array instead of error to prevent UI breakage
    return NextResponse.json({ 
      success: true, 
      entries: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

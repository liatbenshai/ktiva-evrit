import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  let prisma
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma')
    prisma = prismaClient
  } catch (error) {
    console.error('Failed to import Prisma:', error)
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || 'default-user'
    const targetLanguage = searchParams.get('targetLanguage')

    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
    }

    const entries = await prisma.languageEntry.findMany({
      where: {
        userId,
        ...(targetLanguage ? { targetLanguage } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 50,
    })

    const parsedEntries = entries.map((entry) => ({
      ...entry,
      usageExamples: entry.usageExamples ? JSON.parse(entry.usageExamples) : [],
      extraSuggestions: entry.extraSuggestions ? JSON.parse(entry.extraSuggestions) : [],
    }))

    return NextResponse.json({ success: true, entries: parsedEntries })
  } catch (error: any) {
    console.error('Failed to list language entries:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'שגיאה בטעינת המונחים שנשמרו',
        details: error.message || 'Unknown error',
        code: error.code,
      },
      { status: 500 }
    )
  }
}

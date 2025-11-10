import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let prisma
  try {
    const { prisma: prismaClient } = await import('@/lib/prisma')
    prisma = prismaClient
  } catch (error) {
    console.error('Failed to import Prisma:', error)
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const {
      hebrewTerm,
      targetLanguage,
      translatedTerm,
      pronunciation,
      usageExamples,
      culturalNotes,
      extraSuggestions,
      userId = 'default-user',
    } = body

    if (!hebrewTerm || !targetLanguage || !translatedTerm) {
      return NextResponse.json(
        { success: false, error: 'חסר מידע לשמירה (מונח בעברית, שפה או תרגום)' },
        { status: 400 }
      )
    }

    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database not available' }, { status: 500 })
    }

    const entry = await prisma.languageEntry.create({
      data: {
        userId,
        hebrewTerm: hebrewTerm.trim(),
        targetLanguage,
        translatedTerm: translatedTerm.trim(),
        pronunciation: pronunciation?.trim() || null,
        usageExamples: usageExamples ? JSON.stringify(usageExamples) : null,
        notes: culturalNotes?.trim() || null,
        extraSuggestions: extraSuggestions ? JSON.stringify(extraSuggestions) : null,
      },
    })

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Failed to save language entry:', error)
    return NextResponse.json(
      { success: false, error: 'שגיאה בשמירת המונח. נסי שוב מאוחר יותר.' },
      { status: 500 }
    )
  }
}

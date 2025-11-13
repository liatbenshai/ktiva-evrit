import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { COMMON_WORDS } from '@/lib/common-words-database';

/**
 * API endpoint להוספת מאגר המילים הנפוצות למסד הנתונים
 * POST /api/languages/seed-common-words
 * 
 * מוסיף את כל המילים מ-COMMON_WORDS למסד הנתונים עבור כל השפות
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'default-user', overwrite = false } = body;

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    const languages = ['english', 'russian', 'french', 'romanian', 'italian'];
    const results: Record<string, { created: number; skipped: number; errors: number }> = {};

    for (const lang of languages) {
      let created = 0;
      let skipped = 0;
      let errors = 0;

      for (const word of COMMON_WORDS) {
        try {
          // בדיקה אם המילה כבר קיימת
          const existing = await prisma.languageEntry.findFirst({
            where: {
              userId,
              targetLanguage: lang,
              hebrewTerm: word.hebrew,
            },
          });

          if (existing && !overwrite) {
            skipped++;
            continue;
          }

          // קביעת התרגום לפי השפה
          let translatedTerm = '';
          switch (lang) {
            case 'english':
              translatedTerm = word.english;
              break;
            case 'russian':
              translatedTerm = word.russian;
              break;
            case 'french':
              translatedTerm = word.french;
              break;
            case 'romanian':
              translatedTerm = word.romanian;
              break;
            case 'italian':
              translatedTerm = word.italian;
              break;
          }

          if (!translatedTerm) {
            errors++;
            continue;
          }

          if (existing && overwrite) {
            // עדכון רשומה קיימת
            await prisma.languageEntry.update({
              where: { id: existing.id },
              data: {
                translatedTerm: translatedTerm.trim(),
                updatedAt: new Date(),
              },
            });
            created++;
          } else {
            // יצירת רשומה חדשה
            await prisma.languageEntry.create({
              data: {
                userId,
                hebrewTerm: word.hebrew.trim(),
                targetLanguage: lang,
                translatedTerm: translatedTerm.trim(),
                notes: `קטגוריה: ${word.category}`,
              },
            });
            created++;
          }
        } catch (error) {
          console.error(`Error processing word "${word.hebrew}" for ${lang}:`, error);
          errors++;
        }
      }

      results[lang] = { created, skipped, errors };
    }

    const totalCreated = Object.values(results).reduce((sum, r) => sum + r.created, 0);
    const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    return NextResponse.json({
      success: true,
      message: `נוספו ${totalCreated} מילים, דולגו ${totalSkipped}, שגיאות: ${totalErrors}`,
      results,
      summary: {
        totalCreated,
        totalSkipped,
        totalErrors,
        totalWords: COMMON_WORDS.length,
        languages: languages.length,
      },
    });
  } catch (error: any) {
    console.error('Error seeding common words:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בהוספת המילים הנפוצות',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { answer, userId = 'default-user' } = body;
    const exerciseId = params.id;

    const exercise = await prisma.lessonExercise.findUnique({
      where: { id: exerciseId },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'תרגיל לא נמצא' },
        { status: 404 }
      );
    }

    let isCorrect = false;
    let correctAnswer = '';
    let explanation = '';

    // Check answer based on exercise type
    switch (exercise.type) {
      case 'MATCHING':
        // For matching, answer should be the option ID
        const selectedOption = exercise.options.find((opt) => opt.id === answer);
        if (selectedOption) {
          isCorrect = selectedOption.isCorrect;
          correctAnswer = selectedOption.text;
          explanation = selectedOption.explanation || '';
        }
        break;

      case 'FILL_BLANK':
        // For fill blank, compare normalized strings
        const normalizedAnswer = answer?.trim().toLowerCase();
        const normalizedCorrect = exercise.correctAnswer?.trim().toLowerCase();
        isCorrect = normalizedAnswer === normalizedCorrect;
        correctAnswer = exercise.correctAnswer || '';
        break;

      case 'WORD_ORDER':
        // For word order, answer is array of word IDs in order
        // We'll compare with correctAnswer which should be JSON array
        try {
          const correctOrder = exercise.correctAnswer ? JSON.parse(exercise.correctAnswer) : [];
          const userOrder = Array.isArray(answer) ? answer : [];
          isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
          correctAnswer = exercise.correctAnswer || '';
        } catch {
          isCorrect = false;
          correctAnswer = exercise.correctAnswer || '';
        }
        break;

      case 'LISTENING':
        // For listening, similar to fill blank
        const normalizedListeningAnswer = answer?.trim().toLowerCase();
        const normalizedListeningCorrect = exercise.correctAnswer?.trim().toLowerCase();
        isCorrect = normalizedListeningAnswer === normalizedListeningCorrect;
        correctAnswer = exercise.correctAnswer || '';
        break;

      default:
        isCorrect = false;
        correctAnswer = exercise.correctAnswer || '';
    }

    // Calculate score for this exercise
    const exerciseScore = isCorrect ? exercise.points : 0;

    // Update lesson progress if needed
    // We'll calculate total score for the lesson after all exercises
    // For now, just return the result

    return NextResponse.json({
      success: true,
      isCorrect,
      correctAnswer,
      explanation,
      score: exerciseScore,
      maxScore: exercise.points,
    });
  } catch (error: any) {
    console.error('Error submitting exercise:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'שגיאה בבדיקת התרגיל',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


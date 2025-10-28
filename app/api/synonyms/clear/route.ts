import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const result = await prisma.synonym.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      count: result.count 
    });
  } catch (error) {
    console.error('Error clearing synonyms:', error);
    return NextResponse.json(
      { error: 'Failed to clear synonyms' },
      { status: 500 }
    );
  }
}

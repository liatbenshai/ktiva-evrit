import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all idioms
export async function GET() {
  try {
    const idioms = await prisma.idiom.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(idioms);
  } catch (error) {
    console.error('Error fetching idioms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch idioms' },
      { status: 500 }
    );
  }
}

// POST - Create new idiom
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { english, hebrew, category, learned } = body;
    
    if (!english || !hebrew) {
      return NextResponse.json(
        { error: 'English and Hebrew are required' },
        { status: 400 }
      );
    }
    
    const idiom = await prisma.idiom.create({
      data: {
        english,
        hebrew,
        category: category || 'ביטוי',
        learned: learned || false
      }
    });
    
    return NextResponse.json(idiom, { status: 201 });
  } catch (error) {
    console.error('Error creating idiom:', error);
    return NextResponse.json(
      { error: 'Failed to create idiom' },
      { status: 500 }
    );
  }
}

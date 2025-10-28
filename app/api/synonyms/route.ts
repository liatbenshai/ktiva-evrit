import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all synonyms
export async function GET() {
  try {
    const synonyms = await prisma.synonym.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse JSON strings back to arrays
    const parsedSynonyms = synonyms.map(syn => ({
      ...syn,
      alternatives: JSON.parse(syn.alternatives),
      context: syn.context ? JSON.parse(syn.context) : []
    }));
    
    return NextResponse.json(parsedSynonyms);
  } catch (error) {
    console.error('Error fetching synonyms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch synonyms' },
      { status: 500 }
    );
  }
}

// POST - Create new synonym
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primary, alternatives, category, context } = body;
    
    if (!primary || !alternatives || !Array.isArray(alternatives)) {
      return NextResponse.json(
        { error: 'Primary and alternatives array are required' },
        { status: 400 }
      );
    }
    
    const synonym = await prisma.synonym.create({
      data: {
        primary,
        alternatives: JSON.stringify(alternatives),
        category: category || 'general',
        context: context ? JSON.stringify(context) : null
      }
    });
    
    return NextResponse.json({
      ...synonym,
      alternatives: JSON.parse(synonym.alternatives),
      context: synonym.context ? JSON.parse(synonym.context) : []
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating synonym:', error);
    return NextResponse.json(
      { error: 'Failed to create synonym' },
      { status: 500 }
    );
  }
}

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
    
    // Debug logging
    console.log('Received body:', JSON.stringify(body, null, 2));
    console.log('Primary:', primary, 'Type:', typeof primary);
    console.log('Alternatives:', alternatives, 'Type:', typeof alternatives, 'IsArray:', Array.isArray(alternatives));
    
    if (!primary || !alternatives) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Primary and alternatives are required', received: { primary, alternatives } },
        { status: 400 }
      );
    }
    
    // Handle alternatives - could be string or array
    let alternativesArray: string[];
    
    if (typeof alternatives === 'string') {
      try {
        // Try to parse as JSON first
        alternativesArray = JSON.parse(alternatives);
        console.log('Parsed alternatives from JSON string:', alternativesArray);
      } catch {
        // If parsing fails, split by comma
        alternativesArray = alternatives.split(',').map(s => s.trim()).filter(s => s.length > 0);
        console.log('Split alternatives from comma-separated string:', alternativesArray);
      }
    } else if (Array.isArray(alternatives)) {
      alternativesArray = alternatives;
      console.log('Using alternatives as-is (already array):', alternativesArray);
    } else {
      console.error('Invalid alternatives format:', typeof alternatives);
      return NextResponse.json(
        { error: 'Alternatives must be an array or comma-separated string', received: alternatives },
        { status: 400 }
      );
    }
    
    if (alternativesArray.length === 0) {
      console.error('Empty alternatives array');
      return NextResponse.json(
        { error: 'At least one alternative is required' },
        { status: 400 }
      );
    }
    
    // Handle context - could be string or array
    let contextArray: string[] = [];
    
    if (context) {
      if (typeof context === 'string') {
        try {
          contextArray = JSON.parse(context);
        } catch {
          contextArray = [context];
        }
      } else if (Array.isArray(context)) {
        contextArray = context;
      }
    }
    
    console.log('Creating synonym with:', {
      primary,
      alternativesCount: alternativesArray.length,
      category: category || 'general',
      contextCount: contextArray.length
    });
    
    const synonym = await prisma.synonym.create({
      data: {
        primary,
        alternatives: JSON.stringify(alternativesArray),
        category: category || 'general',
        context: contextArray.length > 0 ? JSON.stringify(contextArray) : null
      }
    });
    
    console.log('Synonym created successfully:', synonym.id);
    
    return NextResponse.json({
      ...synonym,
      alternatives: JSON.parse(synonym.alternatives),
      context: synonym.context ? JSON.parse(synonym.context) : []
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating synonym:', error);
    return NextResponse.json(
      { error: 'Failed to create synonym', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

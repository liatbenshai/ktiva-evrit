import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🗑️  Starting to clear all synonyms...');
    
    const result = await prisma.synonym.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} synonyms`);
    
    return NextResponse.json({ 
      success: true, 
      count: result.count,
      message: `Deleted ${result.count} synonyms successfully`
    });
  } catch (error) {
    console.error('❌ Error clearing synonyms:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear synonyms',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

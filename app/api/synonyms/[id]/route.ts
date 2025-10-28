import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get single synonym
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const synonym = await prisma.synonym.findUnique({
      where: { id: params.id }
    });
    
    if (!synonym) {
      return NextResponse.json(
        { error: 'Synonym not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      ...synonym,
      alternatives: JSON.parse(synonym.alternatives),
      context: synonym.context ? JSON.parse(synonym.context) : []
    });
  } catch (error) {
    console.error('Error fetching synonym:', error);
    return NextResponse.json(
      { error: 'Failed to fetch synonym' },
      { status: 500 }
    );
  }
}

// PATCH - Update synonym
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { primary, alternatives, category, context } = body;
    
    const updateData: any = {};
    if (primary !== undefined) updateData.primary = primary;
    if (alternatives !== undefined) updateData.alternatives = JSON.stringify(alternatives);
    if (category !== undefined) updateData.category = category;
    if (context !== undefined) updateData.context = JSON.stringify(context);
    
    const synonym = await prisma.synonym.update({
      where: { id: params.id },
      data: updateData
    });
    
    return NextResponse.json({
      ...synonym,
      alternatives: JSON.parse(synonym.alternatives),
      context: synonym.context ? JSON.parse(synonym.context) : []
    });
  } catch (error) {
    console.error('Error updating synonym:', error);
    return NextResponse.json(
      { error: 'Failed to update synonym' },
      { status: 500 }
    );
  }
}

// DELETE - Delete synonym
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.synonym.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Synonym deleted successfully' });
  } catch (error) {
    console.error('Error deleting synonym:', error);
    return NextResponse.json(
      { error: 'Failed to delete synonym' },
      { status: 500 }
    );
  }
}

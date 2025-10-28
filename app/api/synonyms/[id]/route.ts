import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get single synonym
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { primary, alternatives, category, context: contextData } = body;
    
    const updateData: any = {};
    if (primary !== undefined) updateData.primary = primary;
    if (alternatives !== undefined) updateData.alternatives = JSON.stringify(alternatives);
    if (category !== undefined) updateData.category = category;
    if (contextData !== undefined) updateData.context = JSON.stringify(contextData);
    
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

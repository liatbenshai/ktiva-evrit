import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get single idiom
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idiom = await prisma.idiom.findUnique({
      where: { id: params.id }
    });
    
    if (!idiom) {
      return NextResponse.json(
        { error: 'Idiom not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(idiom);
  } catch (error) {
    console.error('Error fetching idiom:', error);
    return NextResponse.json(
      { error: 'Failed to fetch idiom' },
      { status: 500 }
    );
  }
}

// PATCH - Update idiom
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { english, hebrew, category, learned } = body;
    
    const updateData: any = {};
    if (english !== undefined) updateData.english = english;
    if (hebrew !== undefined) updateData.hebrew = hebrew;
    if (category !== undefined) updateData.category = category;
    if (learned !== undefined) updateData.learned = learned;
    
    const idiom = await prisma.idiom.update({
      where: { id: params.id },
      data: updateData
    });
    
    return NextResponse.json(idiom);
  } catch (error) {
    console.error('Error updating idiom:', error);
    return NextResponse.json(
      { error: 'Failed to update idiom' },
      { status: 500 }
    );
  }
}

// DELETE - Delete idiom
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.idiom.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Idiom deleted successfully' });
  } catch (error) {
    console.error('Error deleting idiom:', error);
    return NextResponse.json(
      { error: 'Failed to delete idiom' },
      { status: 500 }
    );
  }
}

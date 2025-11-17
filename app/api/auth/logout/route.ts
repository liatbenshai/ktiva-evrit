import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    // Clear cookie
    response.cookies.delete('auth-token');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתנתקות' },
      { status: 500 }
    );
  }
}


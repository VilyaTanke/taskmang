import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeRanking } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { initializeDatabase } from '@/lib/database';

// Middleware to verify authentication
function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'day' | 'week' | 'month' || 'week';

    if (!['day', 'week', 'month'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be day, week, or month' },
        { status: 400 }
      );
    }

    const ranking = await getEmployeeRanking(period);
    
    return NextResponse.json({
      period,
      ranking
    });
  } catch (error) {
    console.error('Get ranking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

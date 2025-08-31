import { NextRequest, NextResponse } from 'next/server';
import { updateUserPasswords } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// Middleware to verify authentication
function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can update passwords
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const result = await updateUserPasswords();
    
    return NextResponse.json({
      message: 'Passwords updated successfully',
      updatedCount: result.updatedCount
    });
  } catch (error) {
    console.error('Update passwords error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

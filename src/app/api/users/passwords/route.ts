import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersWithPasswords } from '@/lib/database';
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

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can access passwords
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const usersWithPasswords = await getAllUsersWithPasswords();
    
    // Create a map of user ID to password
    const passwords: Record<string, string> = {};
    usersWithPasswords.forEach(user => {
      passwords[user.id] = user.plainPassword || 'admin123';
    });

    return NextResponse.json({
      passwords
    });
  } catch (error) {
    console.error('Get passwords error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

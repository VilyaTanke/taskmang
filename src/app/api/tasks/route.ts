import { NextRequest, NextResponse } from 'next/server';
import { 
  createTask, 
  getTasksByFilters, 
  getAllPositions,
  getUsersByPosition 
} from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { TaskStatus, Shift } from '@/types';
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
    const positionId = searchParams.get('positionId');
    const status = searchParams.get('status') as TaskStatus;
    const shift = searchParams.get('shift') as Shift;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};
    
    // If not admin, filter by user's position
    if (user.role !== 'ADMIN') {
      filters.positionId = user.positionId;
    } else if (positionId) {
      filters.positionId = positionId;
    }

    if (status) filters.status = status;
    if (shift) filters.shift = shift;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const tasks = await getTasksByFilters(filters);
    
    // Get positions and users for the response
    const positions = await getAllPositions();
    const users = user.role === 'ADMIN' 
      ? await Promise.all(positions.map(p => getUsersByPosition(p.id))).then(users => users.flat())
      : await getUsersByPosition(user.positionId);

    return NextResponse.json({
      tasks,
      positions,
      users
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can create tasks
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { title, description, dueDate, positionId, shift } = await request.json();

    if (!title || !description || !dueDate || !positionId || !shift) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const task = await createTask({
      title,
      description,
      status: TaskStatus.PENDING,
      dueDate: new Date(dueDate),
      positionId,
      shift
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

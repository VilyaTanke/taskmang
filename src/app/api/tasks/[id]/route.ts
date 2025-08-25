import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, duplicateTask } from '@/lib/database';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user can access this task
    if (user.role !== 'ADMIN' && task.positionId !== user.positionId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user can access this task
    if (user.role !== 'ADMIN' && task.positionId !== user.positionId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    
    // Only admins can update task details, but users can mark tasks as completed
    if (user.role !== 'ADMIN') {
      const allowedUpdates: any = {};
      if (updates.status !== undefined) allowedUpdates.status = updates.status;
      if (updates.completedById !== undefined) allowedUpdates.completedById = updates.completedById;
      
      if (Object.keys(allowedUpdates).length === 0) {
        return NextResponse.json(
          { error: 'Forbidden - Only admins can update task details' },
          { status: 403 }
        );
      }
      
      const updatedTask = await updateTask(id, allowedUpdates);
      return NextResponse.json(updatedTask);
    }

    const updatedTask = await updateTask(id, updates);
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can duplicate tasks
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { newDueDate } = await request.json();
    
    if (!newDueDate) {
      return NextResponse.json(
        { error: 'New due date is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const duplicatedTask = await duplicateTask(id, new Date(newDueDate));
    if (!duplicatedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(duplicatedTask, { status: 201 });
  } catch (error) {
    console.error('Duplicate task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

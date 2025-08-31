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
    const status = searchParams.get('status') as TaskStatus | 'OVERDUE';
    const shift = searchParams.get('shift') as Shift;
    const date = searchParams.get('date');

    const filters: Record<string, unknown> = {};
    
    // If not admin or supervisor, filter by user's positions
    if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
      // For regular employees, only show tasks from their assigned positions
      // We'll need to get all tasks and filter them by the user's positions
      const allTasks = await getTasksByFilters({});
      const userPositionIds = user.positionIds || [];
      
      // Filter tasks to only include those from user's assigned positions
      const filteredTasks = allTasks.filter(task => 
        userPositionIds.includes(task.positionId)
      );
      
      // Apply additional filters
      let result = filteredTasks;
      
      if (positionId && userPositionIds.includes(positionId)) {
        result = result.filter(task => task.positionId === positionId);
      }
      
             if (status) {
         if (status === 'OVERDUE') {
           // A task is overdue only after 23:59 of the due date
           result = result.filter(task => {
             if (task.status !== TaskStatus.PENDING) return false;
             
             const taskDueDate = new Date(task.dueDate);
             const now = new Date();
             
             // Set task due date to end of day (23:59:59)
             const endOfDueDay = new Date(taskDueDate);
             endOfDueDay.setHours(23, 59, 59, 999);
             
             return now > endOfDueDay;
           });
         } else {
           result = result.filter(task => task.status === status);
         }
       }
      
      if (shift) {
        result = result.filter(task => task.shift === shift);
      }
      
      if (date) {
        const selectedDate = new Date(date);
        result = result.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate.toDateString() === selectedDate.toDateString();
        });
      }
      
      // Get positions and users for the response
      const positions = await getAllPositions();
      const users = await Promise.all(
        userPositionIds.map(posId => getUsersByPosition(posId))
      ).then(users => users.flat());

      return NextResponse.json({
        tasks: result,
        positions,
        users
      });
    } else {
      // Admin and supervisor can see all tasks and filter as needed
      if (positionId) filters.positionId = positionId;
      if (status && status !== 'OVERDUE') filters.status = status;
      if (shift) filters.shift = shift;

      let tasks = await getTasksByFilters(filters);
      
      // Apply date filter if provided
      if (date) {
        const selectedDate = new Date(date);
        tasks = tasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate.toDateString() === selectedDate.toDateString();
        });
      }
      
             // Apply overdue filter if status is OVERDUE
       if (status === 'OVERDUE') {
         // A task is overdue only after 23:59 of the due date
         tasks = tasks.filter(task => {
           if (task.status !== TaskStatus.PENDING) return false;
           
           const taskDueDate = new Date(task.dueDate);
           const now = new Date();
           
           // Set task due date to end of day (23:59:59)
           const endOfDueDay = new Date(taskDueDate);
           endOfDueDay.setHours(23, 59, 59, 999);
           
           return now > endOfDueDay;
         });
       }
      
      // Get positions and users for the response
      const positions = await getAllPositions();
      const users = await Promise.all(positions.map(p => getUsersByPosition(p.id))).then(users => users.flat());


      
      return NextResponse.json({
        tasks,
        positions,
        users
      });
    }
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

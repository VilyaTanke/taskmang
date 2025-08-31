import { NextResponse } from 'next/server';
import { getAllUsers, getAllPositions, getTasksByFilters, getCardRecordsByFilters } from '@/lib/database';
import { initializeDatabase } from '@/lib/database';

export async function GET() {
  try {
    await initializeDatabase();
    
    // Get all data
    const users = await getAllUsers();
    const positions = await getAllPositions();
    const tasks = await getTasksByFilters({});
    const cardRecords = await getCardRecordsByFilters({});
    
    return NextResponse.json({
      success: true,
      data: {
        users: users.length,
        positions: positions.length,
        tasks: tasks.length,
        cardRecords: cardRecords.length,
        usersData: users,
        positionsData: positions,
        tasksData: tasks,
        cardRecordsData: cardRecords
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

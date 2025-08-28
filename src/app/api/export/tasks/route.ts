import { NextRequest, NextResponse } from 'next/server';
import { getTasksByFilters, getAllPositions, getAllUsers } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { initializeDatabase } from '@/lib/database';
import * as XLSX from 'xlsx';
import { TaskStatus, Shift } from '@/types';

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

    // Only admins can export reports
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const positionId = searchParams.get('positionId');
    const status = searchParams.get('status') as TaskStatus;
    const shift = searchParams.get('shift') as Shift;

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const filters: any = {};
    if (positionId) filters.positionId = positionId;
    if (status) filters.status = status;
    if (shift) filters.shift = shift;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const tasks = await getTasksByFilters(filters);
    const positions = await getAllPositions();
    const users = await getAllUsers();

    // Prepare data for Excel
    const excelData = tasks.map(task => {
      const position = positions.find(p => p.id === task.positionId);
      const completedBy = users.find(u => u.id === task.completedById);
      
      return {
        'ID de Tarea': task.id,
        'Título': task.title,
        'Descripción': task.description,
        'Estado': task.status === TaskStatus.COMPLETED ? 'Completada' : 'Pendiente',
        'Fecha de Vencimiento': new Date(task.dueDate).toLocaleString('es-ES'),
        'Posición': position?.name || 'Sin posición',
        'Turno': getShiftLabel(task.shift),
        'Completada por': completedBy?.name || 'N/A',
        'Completada fuera de fecha': task.completedLate ? 'Sí' : 'No',
        'Fecha de Creación': new Date(task.createdAt).toLocaleString('es-ES'),
        'Fecha de Actualización': new Date(task.updatedAt).toLocaleString('es-ES')
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // ID de Tarea
      { wch: 30 }, // Título
      { wch: 40 }, // Descripción
      { wch: 12 }, // Estado
      { wch: 20 }, // Fecha de Vencimiento
      { wch: 15 }, // Posición
      { wch: 10 }, // Turno
      { wch: 20 }, // Completada por
      { wch: 20 }, // Completada fuera de fecha
      { wch: 20 }, // Fecha de Creación
      { wch: 20 }  // Fecha de Actualización
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Tareas');

    // Generate filename with date range
    const startDateFormatted = new Date(startDate).toISOString().split('T')[0];
    const endDateFormatted = new Date(endDate).toISOString().split('T')[0];
    const filename = `reporte_tareas_${startDateFormatted}_${endDateFormatted}.xlsx`;

    // Convert to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getShiftLabel(shift: Shift): string {
  switch (shift) {
    case Shift.MORNING:
      return 'Mañana';
    case Shift.AFTERNOON:
      return 'Tarde';
    case Shift.NIGHT:
      return 'Noche';
    default:
      return shift;
  }
}

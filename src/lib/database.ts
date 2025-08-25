import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { User, Position, Task, Role, TaskStatus, Shift } from '@/types';

const db = new sqlite3.Database('./taskmang.db');

// Promisify database methods with proper typing
const dbRun = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
const dbAll = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<any[]>;

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create positions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

    // Create users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        positionId TEXT NOT NULL,
        FOREIGN KEY (positionId) REFERENCES positions (id)
      )
    `);

    // Create tasks table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        positionId TEXT NOT NULL,
        shift TEXT NOT NULL,
        completedById TEXT,
        FOREIGN KEY (positionId) REFERENCES positions (id),
        FOREIGN KEY (completedById) REFERENCES users (id)
      )
    `);

    // Insert default positions if they don't exist
    const positions = await dbAll('SELECT * FROM positions');
    if (positions.length === 0) {
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-1', 'San Matias']);
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-2', 'Alconera']);
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-3', 'Moraleja']);
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-4', 'Nava I']);
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-5', 'Nava II']);
    } else {
      // Clear existing positions and insert new ones
      await dbRun('DELETE FROM positions');
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-1', 'San Matias']);
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-2', 'Alconera']);
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-3', 'Moraleja']);
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-4', 'Nava I']);
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-5', 'Nava II']);
    }

    // Insert default admin user if it doesn't exist
    const adminExists = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@taskmang.com']);
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await dbRun(
        'INSERT INTO users (id, name, email, password, role, positionId) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin-1', 'Administrador', 'admin@taskmang.com', hashedPassword, Role.ADMIN, 'pos-4']
      );
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User operations
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await dbRun(
    'INSERT INTO users (id, name, email, password, role, positionId) VALUES (?, ?, ?, ?, ?, ?)',
    [id, user.name, user.email, user.password, user.role, user.positionId]
  );
  return { ...user, id };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
  return user ? user as User : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
  return user ? user as User : null;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const user = await getUserById(id);
  if (!user) return null;

  const updateFields: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    params.push(updates.name);
  }

  if (updates.email !== undefined) {
    updateFields.push('email = ?');
    params.push(updates.email);
  }

  if (updates.role !== undefined) {
    updateFields.push('role = ?');
    params.push(updates.role);
  }

  if (updates.positionId !== undefined) {
    updateFields.push('positionId = ?');
    params.push(updates.positionId);
  }

  if (updateFields.length === 0) return user;

  params.push(id);
  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
  
  await dbRun(query, params);
  
  return await getUserById(id);
}

export async function getUsersByPosition(positionId: string): Promise<User[]> {
  return await dbAll('SELECT * FROM users WHERE positionId = ?', [positionId]);
}

// Position operations
export async function getAllPositions(): Promise<Position[]> {
  return await dbAll('SELECT * FROM positions');
}

export async function getPositionById(id: string): Promise<Position | null> {
  const position = await dbGet('SELECT * FROM positions WHERE id = ?', [id]);
  return position ? position as Position : null;
}

// Task operations
export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  await dbRun(
    'INSERT INTO tasks (id, title, description, status, dueDate, createdAt, updatedAt, positionId, shift, completedById) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, task.title, task.description, task.status, task.dueDate.toISOString(), now, now, task.positionId, task.shift, task.completedById]
  );
  
  return {
    ...task,
    id,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export async function getTaskById(id: string): Promise<Task | null> {
  const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
  if (!task) return null;
  
  return {
    ...task,
    dueDate: new Date(task.dueDate),
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt)
  } as Task;
}

export async function getTasksByPosition(positionId: string): Promise<Task[]> {
  const tasks = await dbAll('SELECT * FROM tasks WHERE positionId = ?', [positionId]);
  return tasks.map(task => ({
    ...task,
    dueDate: new Date(task.dueDate),
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt)
  }));
}

export async function getTasksByFilters(filters: {
  positionId?: string;
  status?: TaskStatus;
  shift?: Shift;
  startDate?: Date;
  endDate?: Date;
}): Promise<Task[]> {
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: any[] = [];

  if (filters.positionId) {
    query += ' AND positionId = ?';
    params.push(filters.positionId);
  }

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.shift) {
    query += ' AND shift = ?';
    params.push(filters.shift);
  }

  if (filters.startDate) {
    query += ' AND dueDate >= ?';
    params.push(filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query += ' AND dueDate <= ?';
    params.push(filters.endDate.toISOString());
  }

  const tasks = await dbAll(query, params);
  return tasks.map(task => ({
    ...task,
    dueDate: new Date(task.dueDate),
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt)
  }));
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const task = await getTaskById(id);
  if (!task) return null;

  const updateFields: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) {
    updateFields.push('title = ?');
    params.push(updates.title);
  }

  if (updates.description !== undefined) {
    updateFields.push('description = ?');
    params.push(updates.description);
  }

  if (updates.status !== undefined) {
    updateFields.push('status = ?');
    params.push(updates.status);
  }

  if (updates.dueDate !== undefined) {
    updateFields.push('dueDate = ?');
    params.push(updates.dueDate.toISOString());
  }

  if (updates.positionId !== undefined) {
    updateFields.push('positionId = ?');
    params.push(updates.positionId);
  }

  if (updates.shift !== undefined) {
    updateFields.push('shift = ?');
    params.push(updates.shift);
  }

  if (updates.completedById !== undefined) {
    updateFields.push('completedById = ?');
    params.push(updates.completedById);
  }

  if (updateFields.length === 0) return task;

  updateFields.push('updatedAt = ?');
  params.push(new Date().toISOString());
  params.push(id);

  await dbRun(`UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`, params);
  
  return await getTaskById(id);
}

export async function duplicateTask(taskId: string, newDueDate: Date): Promise<Task | null> {
  const originalTask = await getTaskById(taskId);
  if (!originalTask) return null;

  const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
    title: originalTask.title,
    description: originalTask.description,
    status: TaskStatus.PENDING,
    dueDate: newDueDate,
    positionId: originalTask.positionId,
    shift: originalTask.shift
  };

  return await createTask(newTask);
}

export async function getEmployeeRanking(period: 'day' | 'week' | 'month'): Promise<Array<{
  id: string;
  name: string;
  position: string;
  role: string;
  tasksCompleted: number;
  totalTasks: number;
}>> {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  const query = `
    SELECT 
      u.id,
      u.name,
      p.name as position,
      u.role,
      COUNT(CASE WHEN t.id IS NOT NULL THEN 1 END) as tasksCompleted,
      COUNT(*) as totalTasks
    FROM users u
    LEFT JOIN positions p ON u.positionId = p.id
    LEFT JOIN tasks t ON u.id = t.completedById AND t.dueDate >= ?
    WHERE u.role != 'ADMIN'
    GROUP BY u.id, u.name, p.name, u.role
    ORDER BY tasksCompleted DESC
  `;

  return await dbAll(query, [startDate.toISOString()]);
}

// Close database connection
export function closeDatabase() {
  if (db) {
    db.close();
  }
}

// Check if database is ready
export function isDatabaseReady(): boolean {
  return db !== null && db !== undefined;
}

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { User, Position, Task, Role, TaskStatus, Shift, CardRecord } from '@/types';

const db = new sqlite3.Database('./taskmang.db');

// Promisify database methods with proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbRun = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAll = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<any[]>;

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');

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
        role TEXT NOT NULL
      )
    `);

    // Create user_positions junction table for many-to-many relationship
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_positions (
        userId TEXT NOT NULL,
        positionId TEXT NOT NULL,
        PRIMARY KEY (userId, positionId),
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (positionId) REFERENCES positions (id) ON DELETE CASCADE
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
        completedLate INTEGER DEFAULT 0,
        FOREIGN KEY (positionId) REFERENCES positions (id),
        FOREIGN KEY (completedById) REFERENCES users (id)
      )
    `);

    // Create card records table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS card_records (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        positionId TEXT NOT NULL,
        cardType TEXT NOT NULL,
        count INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (positionId) REFERENCES positions (id)
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
      await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', ['pos-6', 'Todas']);
    } else {
      // Update existing positions to match the new structure
      const expectedPositions = [
        { id: 'pos-1', name: 'San Matias' },
        { id: 'pos-2', name: 'Alconera' },
        { id: 'pos-3', name: 'Moraleja' },
        { id: 'pos-4', name: 'Nava I' },
        { id: 'pos-5', name: 'Nava II' },
        { id: 'pos-6', name: 'Todas' },
      ];

      for (const pos of expectedPositions) {
        const existingPos = await dbGet('SELECT * FROM positions WHERE id = ?', [pos.id]);
        if (existingPos) {
          // Update existing position name if different
          if (existingPos.name !== pos.name) {
            await dbRun('UPDATE positions SET name = ? WHERE id = ?', [pos.name, pos.id]);
          }
        } else {
          // Insert new position
          await dbRun('INSERT INTO positions (id, name) VALUES (?, ?)', [pos.id, pos.name]);
        }
      }
    }

    // Insert default admin user if it doesn't exist
    const adminExists = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@taskmang.com']);
    if (!adminExists) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await dbRun(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        ['admin-1', 'Administrador', 'admin@taskmang.com', hashedPassword, Role.ADMIN]
      );
      // Add admin to position
      await dbRun('INSERT INTO user_positions (userId, positionId) VALUES (?, ?)', ['admin-1', 'pos-4']);
    }

    // Run migrations for existing databases
    await runMigrations();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Database migration function
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Check if users table has the old positionId column
    const tableInfo = await dbAll("PRAGMA table_info(users)");
    const hasPositionId = tableInfo.some(col => col.name === 'positionId');
    
    if (hasPositionId) {
      console.log('Migrating users table from single position to multiple positions...');
      
      // Migrate existing positionId data to user_positions table
      const usersWithPosition = await dbAll('SELECT id, positionId FROM users WHERE positionId IS NOT NULL AND positionId != ""');
      
      for (const user of usersWithPosition) {
        if (user.positionId) {
          // Insert into user_positions
          await dbRun(
            'INSERT OR IGNORE INTO user_positions (userId, positionId) VALUES (?, ?)',
            [user.id, user.positionId]
          );
        }
      }
      
      // Remove the old positionId column (SQLite doesn't support DROP COLUMN directly)
      // We'll create a new table without the positionId column
      await dbRun('BEGIN TRANSACTION');
      
      try {
        // Create new users table without positionId
        await dbRun(`
          CREATE TABLE users_new (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
          )
        `);
        
        // Copy data from old table to new table
        await dbRun(`
          INSERT INTO users_new (id, name, email, password, role)
          SELECT id, name, email, password, role FROM users
        `);
        
        // Drop old table and rename new table
        await dbRun('DROP TABLE users');
        await dbRun('ALTER TABLE users_new RENAME TO users');
        
        await dbRun('COMMIT');
        console.log('Successfully migrated users table');
      } catch (error) {
        await dbRun('ROLLBACK');
        console.error('Migration failed, rolling back:', error);
        throw error;
      }
    }
    
    // Check if tasks table has the completedLate column
    const tasksTableInfo = await dbAll("PRAGMA table_info(tasks)");
    const hasCompletedLate = tasksTableInfo.some(col => col.name === 'completedLate');
    
    if (!hasCompletedLate) {
      console.log('Adding completedLate column to tasks table...');
      await dbRun('ALTER TABLE tasks ADD COLUMN completedLate INTEGER DEFAULT 0');
      console.log('Successfully added completedLate column to tasks table');
    }
    
    console.log('Database migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

// User operations
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Start transaction
  await dbRun('BEGIN TRANSACTION');
  
  try {
    // Insert user
    await dbRun(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, user.name, user.email, user.password, user.role]
    );
    
    // Insert user-position relationships
    for (const positionId of user.positionIds) {
      await dbRun(
        'INSERT INTO user_positions (userId, positionId) VALUES (?, ?)',
        [id, positionId]
      );
    }
    
    await dbRun('COMMIT');
    
    return { ...user, id };
  } catch (error) {
    await dbRun('ROLLBACK');
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return null;
  
  // Get user positions
  const positions = await dbAll('SELECT positionId FROM user_positions WHERE userId = ?', [user.id]);
  const positionIds = positions.map(p => p.positionId);
  
  return {
    ...user,
    positionIds
  } as User;
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) return null;
  
  // Get user positions
  const positions = await dbAll('SELECT positionId FROM user_positions WHERE userId = ?', [id]);
  const positionIds = positions.map(p => p.positionId);
  
  return {
    ...user,
    positionIds
  } as User;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const user = await getUserById(id);
  if (!user) return null;

  // Start transaction
  await dbRun('BEGIN TRANSACTION');
  
  try {
    const updateFields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Update user fields if any
    if (updateFields.length > 0) {
      params.push(id);
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await dbRun(query, params);
    }

    // Update positions if provided
    if (updates.positionIds !== undefined) {
      // Remove existing positions
      await dbRun('DELETE FROM user_positions WHERE userId = ?', [id]);
      
      // Add new positions
      for (const positionId of updates.positionIds) {
        await dbRun(
          'INSERT INTO user_positions (userId, positionId) VALUES (?, ?)',
          [id, positionId]
        );
      }
    }
    
    await dbRun('COMMIT');
    
    return await getUserById(id);
  } catch (error) {
    await dbRun('ROLLBACK');
    throw error;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    // Delete user (cascade will remove user_positions)
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export async function getUsersByPosition(positionId: string): Promise<User[]> {
  const users = await dbAll(`
    SELECT u.*, GROUP_CONCAT(up.positionId) as positionIds
    FROM users u
    JOIN user_positions up ON u.id = up.userId
    WHERE up.positionId = ?
    GROUP BY u.id
  `, [positionId]);
  
  return users.map(user => ({
    ...user,
    positionIds: user.positionIds ? user.positionIds.split(',') : []
  }));
}

export async function getAllUsers(): Promise<User[]> {
  const users = await dbAll(`
    SELECT u.*, GROUP_CONCAT(up.positionId) as positionIds
    FROM users u
    LEFT JOIN user_positions up ON u.id = up.userId
    GROUP BY u.id
  `);
  
  return users.map(user => ({
    ...user,
    positionIds: user.positionIds ? user.positionIds.split(',') : []
  }));
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
    'INSERT INTO tasks (id, title, description, status, dueDate, createdAt, updatedAt, positionId, shift, completedById, completedLate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, task.title, task.description, task.status, task.dueDate.toISOString(), now, now, task.positionId, task.shift, task.completedById, task.completedLate ? 1 : 0]
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
    updatedAt: new Date(task.updatedAt),
    completedLate: Boolean(task.completedLate)
  } as Task;
}

export async function getTasksByPosition(positionId: string): Promise<Task[]> {
  const tasks = await dbAll('SELECT * FROM tasks WHERE positionId = ?', [positionId]);
  return tasks.map(task => ({
    ...task,
    dueDate: new Date(task.dueDate),
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    completedLate: Boolean(task.completedLate)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    updatedAt: new Date(task.updatedAt),
    completedLate: Boolean(task.completedLate)
  }));
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const task = await getTaskById(id);
  if (!task) return null;

  const updateFields: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (updates.completedLate !== undefined) {
    updateFields.push('completedLate = ?');
    params.push(updates.completedLate ? 1 : 0);
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
      GROUP_CONCAT(p.name) as position,
      u.role,
      COUNT(CASE WHEN t.id IS NOT NULL THEN 1 END) as tasksCompleted,
      COUNT(*) as totalTasks
    FROM users u
    LEFT JOIN user_positions up ON u.id = up.userId
    LEFT JOIN positions p ON up.positionId = p.id
    LEFT JOIN tasks t ON u.id = t.completedById AND t.dueDate >= ?
    WHERE u.role != 'ADMIN'
    GROUP BY u.id, u.name, u.role
    ORDER BY tasksCompleted DESC
  `;

  return await dbAll(query, [startDate.toISOString()]);
}

// Card operations
export async function createOrUpdateCardRecord(record: Omit<CardRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CardRecord> {
  const now = new Date().toISOString();
  const existing = await dbGet(
    'SELECT * FROM card_records WHERE userId = ? AND positionId = ? AND cardType = ?',
    [record.userId, record.positionId, record.cardType]
  );
  if (existing) {
    await dbRun('UPDATE card_records SET count = ?, updatedAt = ? WHERE id = ?', [record.count, now, existing.id]);
    const updated = await dbGet('SELECT * FROM card_records WHERE id = ?', [existing.id]);
    return { ...updated, createdAt: new Date(updated.createdAt), updatedAt: new Date(updated.updatedAt) } as CardRecord;
  }
  const id = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await dbRun(
    'INSERT INTO card_records (id, userId, positionId, cardType, count, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, record.userId, record.positionId, record.cardType, record.count, now, now]
  );
  return { ...record, id, createdAt: new Date(now), updatedAt: new Date(now) } as CardRecord;
}

export async function getCardRecordsByFilters(filters: { positionId?: string }): Promise<CardRecord[]> {
  let query = 'SELECT * FROM card_records WHERE 1=1';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];
  if (filters.positionId) { query += ' AND positionId = ?'; params.push(filters.positionId); }
  const rows = await dbAll(query, params);
  return rows.map(r => ({ ...r, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) } as CardRecord));
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


import { initializeDatabase } from './database';

let isInitialized = false;

export async function ensureDatabaseInitialized() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
      console.log('Database initialization completed');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
}

// Initialize database on module load
ensureDatabaseInitialized().catch(console.error);

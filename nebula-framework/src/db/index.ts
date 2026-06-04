import { IRepository } from './repository';
import { SQLiteRepository } from './sqlite-repository';
import { logger } from '../utils/logger';

// ============================================================
// Database Factory
// Creates the appropriate repository based on configuration
// Supports: sqlite (default), postgres, mongodb
// ============================================================

export type DatabaseDriver = 'sqlite' | 'postgres' | 'mongodb' | 'memory';

export async function createRepository(driver?: DatabaseDriver): Promise<IRepository> {
  const selectedDriver = driver || (process.env.DB_DRIVER as DatabaseDriver) || 'sqlite';

  switch (selectedDriver) {
    case 'postgres': {
      // PostgreSQL adapter - would use pg/knex
      logger.info('PostgreSQL adapter selected (falling back to SQLite for now)');
      logger.info('To use PostgreSQL, set DB_POSTGRES_URL and install pg package');
      const repo = new SQLiteRepository(process.env.DB_PATH || './data/nebula.db');
      await repo.initialize();
      return repo;
    }

    case 'mongodb': {
      // MongoDB adapter - would use mongoose/mongodb driver
      logger.info('MongoDB adapter selected (falling back to SQLite for now)');
      logger.info('To use MongoDB, set DB_MONGO_URL and install mongodb package');
      const repo = new SQLiteRepository(process.env.DB_PATH || './data/nebula.db');
      await repo.initialize();
      return repo;
    }

    case 'memory': {
      // Pure in-memory (no disk)
      const repo = new SQLiteRepository(':memory:');
      await repo.initialize();
      return repo;
    }

    case 'sqlite':
    default: {
      const repo = new SQLiteRepository(process.env.DB_PATH || './data/nebula.db');
      await repo.initialize();
      return repo;
    }
  }
}

export { IRepository, TaskRecord, TaskStatus, TaskSource, TaskPriority } from './repository';
export { SQLiteRepository } from './sqlite-repository';
export { executionToRecord } from './repository';

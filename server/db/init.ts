import { db } from './index';
import { roles, users } from './schema';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha512').update(password).digest('hex');
}

export async function initializeDatabase() {
  try {
    // Create roles
    const adminRoleId = uuidv4();
    const userRoleId = uuidv4();

    await db.insert(roles).values([
      { id: adminRoleId, name: 'administrator' },
      { id: userRoleId, name: 'user' }
    ]);

    // Create default admin user
    await db.insert(users).values({
      id: uuidv4(),
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash: hashPassword('Admin-123!'),
      company: 'System',
      roleId: adminRoleId
    });

    console.log('Database initialized with roles and default admin user');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

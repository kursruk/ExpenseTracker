import { db } from '../db';
import { roles, users } from './schema';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha512').update(password).digest('hex');
}

export async function initializeDatabase() {
  try {
    console.log('Starting roles and admin user initialization...'); //Added log statement

    // Create roles
    const adminRoleId = uuidv4();
    const userRoleId = uuidv4();

    await db.insert(roles).values([
      { id: adminRoleId, name: 'administrator' },
      { id: userRoleId, name: 'user' }
    ]);

    console.log('Roles created successfully');

    // Create default admin user
    const adminUser = {
      id: uuidv4(),
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash: hashPassword('Admin-123!'),
      company: 'System',
      roleId: adminRoleId
    };

    await db.insert(users).values(adminUser);

    console.log('Default admin user created successfully');

    // Verify roles and admin user
    const createdRoles = await db.select().from(roles);
    const createdUsers = await db.select().from(users);

    console.log('Created roles:', createdRoles);
    console.log('Created users:', createdUsers);

  } catch (error) {
    console.error('Error initializing database:', error);
    // If error is about duplicate entries, that's fine - means data already exists
    if (!(error instanceof Error) || !error.message.includes('UNIQUE constraint failed')) {
      throw error;
    }
  }
}
import { User } from '../types';
import { AuthService } from './auth.service';
import db from '../db/database';

export class UserService {
  async createUser(username: string, password: string): Promise<User> {
    // Check if username already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await AuthService.hashPassword(password);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const insert = db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)');
    insert.run(userId, username, hashedPassword);

    return {
      id: userId,
      username,
      password: hashedPassword, // Note: we return it but it's hashed
    };
  }

  async authenticateUser(username: string, password: string): Promise<User> {
    const user = db
      .prepare('SELECT id, username, password FROM users WHERE username = ?')
      .get(username) as { id: string; username: string; password: string } | undefined;

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await AuthService.comparePassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      username: user.username,
      password: user.password,
    };
  }

  getUserById(userId: string): User | undefined {
    const user = db
      .prepare('SELECT id, username, password FROM users WHERE id = ?')
      .get(userId) as { id: string; username: string; password: string } | undefined;

    if (!user) {
      return undefined;
    }

    return {
      id: user.id,
      username: user.username,
      password: user.password,
    };
  }

  getUserByUsername(username: string): User | undefined {
    const user = db
      .prepare('SELECT id, username, password FROM users WHERE username = ?')
      .get(username) as { id: string; username: string; password: string } | undefined;

    if (!user) {
      return undefined;
    }

    return {
      id: user.id,
      username: user.username,
      password: user.password,
    };
  }

  getAllUsers(): User[] {
    const users = db
      .prepare('SELECT id, username, password FROM users')
      .all() as { id: string; username: string; password: string }[];

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      password: user.password,
    }));
  }
}

// Singleton instance
export const userService = new UserService();

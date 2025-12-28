import { User } from '../types';
import { AuthService } from './auth.service';

export class UserService {
  private users: Map<string, User> = new Map();
  private usersByUsername: Map<string, User> = new Map();

  async createUser(username: string, password: string): Promise<User> {
    if (this.usersByUsername.has(username)) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await AuthService.hashPassword(password);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const user: User = {
      id: userId,
      username,
      password: hashedPassword,
    };

    this.users.set(userId, user);
    this.usersByUsername.set(username, user);

    return user;
  }

  async authenticateUser(username: string, password: string): Promise<User> {
    const user = this.usersByUsername.get(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await AuthService.comparePassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUserByUsername(username: string): User | undefined {
    return this.usersByUsername.get(username);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

// Singleton instance
export const userService = new UserService();


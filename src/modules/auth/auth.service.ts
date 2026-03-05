import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.validator';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import { env } from '../../config/env';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(input: RegisterInput) {
    const existingUser = await this.authRepository.findUserByEmail(input.email);
    
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    
    const user = await this.authRepository.createUser(
      input.email,
      hashedPassword,
      input.name
    );

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(input: LoginInput) {
    const user = await this.authRepository.findUserByEmail(input.email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  async verifyToken(token: string): Promise<string> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}

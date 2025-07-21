// TypeScript Demo - Showcasing Bogster Theme Colors

import { Request, Response, NextFunction } from 'express';
import { Logger } from './utils/logger';
import type { User, ApiResponse, Config } from './types';

// Configuration with type annotations
const config: Config = {
  port: 3000,
  host: 'localhost',
  debug: process.env.NODE_ENV !== 'production',
  features: {
    authentication: true,
    rateLimit: { enabled: true, maxRequests: 100 },
    cache: { ttl: 3600, strategy: 'memory' }
  }
};

/**
 * User authentication middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_MISSING'
    });
    return;
  }

  try {
    const user = await validateToken(token);
    req.user = user;
    Logger.info(`User ${user.id} authenticated successfully`);
    next();
  } catch (error) {
    Logger.error('Authentication failed:', error);
    res.status(403).json({ 
      error: 'Invalid token',
      code: 'AUTH_INVALID' 
    });
  }
}

// Generic API response wrapper
function createResponse<T>(
  data: T,
  meta?: { count?: number; page?: number }
): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(meta && { meta })
  };
}

// Async function with error handling
async function validateToken(token: string): Promise<User> {
  // Token validation logic
  const decoded = await jwt.verify(token, process.env.JWT_SECRET!);
  
  return {
    id: decoded.userId,
    email: decoded.email,
    roles: decoded.roles || ['user'],
    createdAt: new Date(decoded.iat * 1000)
  };
}

// Class with decorators and private methods
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  
  constructor(
    @Inject('USER_REPOSITORY') private userRepo: Repository<User>,
    @Inject('CACHE_SERVICE') private cache: CacheService
  ) {}
  
  async findById(id: string): Promise<User | null> {
    const cached = await this.cache.get(`user:${id}`);
    if (cached) return cached;
    
    const user = await this.userRepo.findOne({ where: { id } });
    if (user) {
      await this.cache.set(`user:${id}`, user, 300);
    }
    
    return user;
  }
  
  @Transactional()
  async updateProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    
    Object.assign(user, updates);
    return this.userRepo.save(user);
  }
}

// Enum and union types
enum Status {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted'
}

type Result<T> = 
  | { success: true; value: T }
  | { success: false; error: Error };

// Utility function with generics
function isError<T>(result: Result<T>): result is { success: false; error: Error } {
  return !result.success;
}

// Example usage
const result = await processUser(userId);
if (isError(result)) {
  console.error(`Failed to process user: ${result.error.message}`);
} else {
  console.log(`User processed: ${result.value.email}`);
}
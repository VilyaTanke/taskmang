import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Role } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  positionId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    positionId: user.positionId
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}

export function isSupervisor(role: Role): boolean {
  return role === Role.SUPERVISOR || role === Role.ADMIN;
}

export function canAccessPosition(userPositionId: string, targetPositionId: string, userRole: Role): boolean {
  if (userRole === Role.ADMIN) return true;
  return userPositionId === targetPositionId;
}

export async function getAuthUser(request: Request): Promise<{ success: boolean; user?: JWTPayload; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No authorization header' };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return { success: false, error: 'Invalid token' };
    }

    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
}

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'nexo-medico-ai-super-secret-key-2026';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  hospitalId: string | null;
  departmentId?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function signJwtToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyJwtToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (err) {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): UserPayload | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyJwtToken(token);
  }

  const cookieToken = req.cookies.get('nexo_token')?.value;
  if (cookieToken) {
    return verifyJwtToken(cookieToken);
  }

  return null;
}

export function formatNameFromEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) return 'Patient Account';
  const handle = email.split('@')[0];
  if (!handle) return 'Patient Account';

  const cleanHandle = handle.replace(/\d+$/, '');
  const target = cleanHandle || handle;

  const parts = target.split(/[\._\-]/).filter(Boolean);
  if (parts.length === 0) return 'Patient Account';

  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

// SECURITY HIERARCHY HELPER SERVICES
export function isSuperAdmin(user: UserPayload | null): boolean {
  if (!user) return false;
  return user.role === 'SUPER_ADMIN';
}

export function isHospitalAdmin(user: UserPayload | null): boolean {
  if (!user) return false;
  return user.role === 'HOSPITAL_ADMIN' || user.role === 'SUPER_ADMIN';
}

export function checkTenantAccess(user: UserPayload | null, targetHospitalId: string | null): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true; // Super Admin operates above all hospital tenants
  if (!targetHospitalId || !user.hospitalId) return false;
  return user.hospitalId === targetHospitalId;
}

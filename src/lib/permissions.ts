import { prisma } from './prisma';
import { UserPayload } from './auth';

export async function hasPermission(user: UserPayload, permissionCode: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.role === 'HOSPITAL_ADMIN') return true;

  // Check custom user permission overrides first
  const customPerm = await prisma.userPermission.findFirst({
    where: {
      userId: user.id,
      permission: { code: permissionCode }
    }
  });

  if (customPerm !== null) {
    return customPerm.granted;
  }

  // Fallback to Role Permissions mapping
  const roleObj = await prisma.role.findUnique({
    where: { code: user.role },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  if (!roleObj) return false;

  return roleObj.permissions.some(rp => rp.permission.code === permissionCode);
}

export function enforceTenantIsolation(user: UserPayload, targetHospitalId?: string | null): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (!user.hospitalId) return false;
  if (targetHospitalId && user.hospitalId !== targetHospitalId) return false;
  return true;
}

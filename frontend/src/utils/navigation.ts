import type { Role } from '../types/api';

export function getHomeRouteForRole(role: Role | undefined | null): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/menu';
    case 'KITCHEN':
      return '/kds';
    case 'STAFF':
    default:
      return '/pos/tables';
  }
}

export function getRoleDisplayLabel(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'Quản lý';
    case 'KITCHEN':
      return 'Đầu bếp';
    case 'STAFF':
      return 'Phục vụ / Thu ngân';
  }
}

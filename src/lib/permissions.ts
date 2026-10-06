// Permission / Feature-flag layer — no scattered if statements in components
// New roles and permissions are added HERE only, never in UI files.

export type Role = 'agent' | 'supervisor';

interface Permissions {
  canMarkPacked: boolean;
  canHoldOrder: boolean;
  canCancelOrder: boolean;
  canViewKpiPanel: boolean;
  canViewSlaBreachRate: boolean;
  canViewSupervisorWidget: boolean;
}

const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  agent: {
    canMarkPacked: true,
    canHoldOrder: false,
    canCancelOrder: false,
    canViewKpiPanel: true,
    canViewSlaBreachRate: false,
    canViewSupervisorWidget: false,
  },
  supervisor: {
    canMarkPacked: true,
    canHoldOrder: true,
    canCancelOrder: true,
    canViewKpiPanel: true,
    canViewSlaBreachRate: true,
    canViewSupervisorWidget: true,
  },
};

export function getPermissions(role: Role): Permissions {
  return ROLE_PERMISSIONS[role];
}

export function usePermissions(role: Role): Permissions {
  return getPermissions(role);
}

import { describe, it, expect } from 'vitest';
import { getPermissions } from '../lib/permissions';

describe('permissions', () => {
  describe('agent role', () => {
    const perms = getPermissions('agent');

    it('can mark packed', () => expect(perms.canMarkPacked).toBe(true));
    it('cannot hold orders', () => expect(perms.canHoldOrder).toBe(false));
    it('cannot cancel orders', () => expect(perms.canCancelOrder).toBe(false));
    it('can view KPI panel', () => expect(perms.canViewKpiPanel).toBe(true));
    it('cannot view SLA breach rate', () => expect(perms.canViewSlaBreachRate).toBe(false));
  });

  describe('supervisor role', () => {
    const perms = getPermissions('supervisor');

    it('can mark packed', () => expect(perms.canMarkPacked).toBe(true));
    it('can hold orders', () => expect(perms.canHoldOrder).toBe(true));
    it('can cancel orders', () => expect(perms.canCancelOrder).toBe(true));
    it('can view SLA breach rate', () => expect(perms.canViewSlaBreachRate).toBe(true));
    it('can view supervisor widget', () => expect(perms.canViewSupervisorWidget).toBe(true));
  });
});

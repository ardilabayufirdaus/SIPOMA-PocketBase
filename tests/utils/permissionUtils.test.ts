import { buildPermissionMatrix } from '../../utils/permissionUtils';
import { PermissionMatrix } from '../../types';

describe('buildPermissionMatrix', () => {
  it('should build PermissionMatrix from user permissions array', () => {
    const userPermissions = [
      {
        permissions: {
          module_name: 'dashboard',
          permission_level: 'READ',
          plant_units: null,
        },
      },
      {
        permissions: {
          module_name: 'plant_operations',
          permission_level: 'WRITE',
          plant_units: [
            { category: 'Packing', unit: 'Unit1' },
            { category: 'Packing', unit: 'Unit2' },
          ],
        },
      },
    ];

    const result: PermissionMatrix = buildPermissionMatrix(userPermissions);

    expect(result.dashboard).toBe('READ');
    expect((result.plant_operations as any).Packing.Unit1).toBe('WRITE');
    expect((result.plant_operations as any).Packing.Unit2).toBe('WRITE');
  });

  it('should handle empty permissions array', () => {
    const result: PermissionMatrix = buildPermissionMatrix([]);

    expect(result.dashboard).toBe('NONE');
    expect(result.plant_operations).toEqual({});
  });
});

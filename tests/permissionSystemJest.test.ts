/**
 * Test file untuk permission system
 * Memverifikasi implementasi role-based access control (RBAC)
 */

import { PermissionChecker } from "../utils/permissions";
import { User, UserRole, PermissionLevel, PermissionMatrix } from "../types";

// Mock users dengan different roles
const mockSuperAdmin: User = {
  id: "1",
  username: "superadmin",
  full_name: "Super Admin User",
  role: UserRole.SUPER_ADMIN,
  last_active: new Date(),
  is_active: true,
  created_at: new Date(),
  permissions: {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.READ,
    plant_operations: {},
    packing_plant: PermissionLevel.READ,
    project_management: PermissionLevel.READ,
    system_settings: PermissionLevel.READ,
  },
};

const mockViewer: User = {
  id: "2",
  username: "viewer",
  full_name: "Viewer User",
  role: UserRole.VIEWER,
  last_active: new Date(),
  is_active: true,
  created_at: new Date(),
  permissions: {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.NONE,
    plant_operations: {},
    packing_plant: PermissionLevel.NONE,
    project_management: PermissionLevel.NONE,
    system_settings: PermissionLevel.NONE,
  },
};

const mockAdmin: User = {
  id: "3",
  username: "admin",
  full_name: "Admin User",
  role: UserRole.ADMIN,
  last_active: new Date(),
  is_active: true,
  created_at: new Date(),
  permissions: {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.WRITE,
    plant_operations: {
      CCR: {
        "Unit 1": PermissionLevel.WRITE,
        "Unit 2": PermissionLevel.READ,
      },
    },
    packing_plant: PermissionLevel.WRITE,
    project_management: PermissionLevel.WRITE,
    system_settings: PermissionLevel.ADMIN,
  },
};

const mockOperator: User = {
  id: "4",
  username: "operator",
  full_name: "Operator User",
  role: UserRole.OPERATOR,
  last_active: new Date(),
  is_active: true,
  created_at: new Date(),
  permissions: {
    dashboard: PermissionLevel.READ,
    user_management: PermissionLevel.NONE,
    plant_operations: {
      CCR: {
        "Unit 1": PermissionLevel.WRITE,
      },
    },
    packing_plant: PermissionLevel.READ,
    project_management: PermissionLevel.NONE,
    system_settings: PermissionLevel.NONE,
  },
};

describe("Permission System Tests", () => {
  describe("Super Admin Permissions", () => {
    const checker = new PermissionChecker(mockSuperAdmin);

    test("should have access to all features", () => {
      expect(checker.hasPermission("dashboard", PermissionLevel.READ)).toBe(
        true
      );
      expect(
        checker.hasPermission("user_management", PermissionLevel.READ)
      ).toBe(true);
      expect(
        checker.hasPermission("user_management", PermissionLevel.WRITE)
      ).toBe(true);
      expect(
        checker.hasPermission("user_management", PermissionLevel.ADMIN)
      ).toBe(true);
      expect(
        checker.hasPermission("plant_operations", PermissionLevel.READ)
      ).toBe(true);
      expect(checker.hasPermission("packing_plant", PermissionLevel.READ)).toBe(
        true
      );
      expect(
        checker.hasPermission("project_management", PermissionLevel.READ)
      ).toBe(true);
      expect(
        checker.hasPermission("system_settings", PermissionLevel.READ)
      ).toBe(true);
    });
  });

  describe("Viewer Permissions", () => {
    const checker = new PermissionChecker(mockViewer);

    test("should only have read access to dashboard", () => {
      expect(checker.hasPermission("dashboard", PermissionLevel.READ)).toBe(
        true
      );
      expect(checker.hasPermission("dashboard", PermissionLevel.WRITE)).toBe(
        false
      );
      expect(
        checker.hasPermission("user_management", PermissionLevel.READ)
      ).toBe(false);
      expect(
        checker.hasPermission("plant_operations", PermissionLevel.READ)
      ).toBe(false);
      expect(checker.hasPermission("packing_plant", PermissionLevel.READ)).toBe(
        false
      );
      expect(
        checker.hasPermission("project_management", PermissionLevel.READ)
      ).toBe(false);
      expect(
        checker.hasPermission("system_settings", PermissionLevel.READ)
      ).toBe(false);
    });
  });

  describe("Admin Permissions", () => {
    const checker = new PermissionChecker(mockAdmin);

    test("should have appropriate permissions based on matrix", () => {
      expect(checker.hasPermission("dashboard", PermissionLevel.READ)).toBe(
        true
      );
      expect(
        checker.hasPermission("user_management", PermissionLevel.WRITE)
      ).toBe(true);
      expect(
        checker.hasPermission("user_management", PermissionLevel.ADMIN)
      ).toBe(false);
      expect(
        checker.hasPermission("plant_operations", PermissionLevel.READ)
      ).toBe(true);
      expect(
        checker.hasPermission("packing_plant", PermissionLevel.WRITE)
      ).toBe(true);
      expect(
        checker.hasPermission("project_management", PermissionLevel.WRITE)
      ).toBe(true);
      expect(
        checker.hasPermission("system_settings", PermissionLevel.ADMIN)
      ).toBe(true);
    });
  });

  describe("Operator Permissions", () => {
    const checker = new PermissionChecker(mockOperator);

    test("should have limited permissions", () => {
      expect(checker.hasPermission("dashboard", PermissionLevel.READ)).toBe(
        true
      );
      expect(
        checker.hasPermission("user_management", PermissionLevel.READ)
      ).toBe(false);
      expect(
        checker.hasPermission("plant_operations", PermissionLevel.READ)
      ).toBe(true);
      expect(checker.hasPermission("packing_plant", PermissionLevel.READ)).toBe(
        true
      );
      expect(
        checker.hasPermission("project_management", PermissionLevel.READ)
      ).toBe(false);
      expect(
        checker.hasPermission("system_settings", PermissionLevel.READ)
      ).toBe(false);
    });
  });

  describe("Plant Operation Specific Permissions", () => {
    const adminChecker = new PermissionChecker(mockAdmin);
    const operatorChecker = new PermissionChecker(mockOperator);

    test("Admin should have specific plant operation permissions", () => {
      expect(
        adminChecker.hasPlantOperationPermission(
          "CCR",
          "Unit 1",
          PermissionLevel.WRITE
        )
      ).toBe(true);
      expect(
        adminChecker.hasPlantOperationPermission(
          "CCR",
          "Unit 2",
          PermissionLevel.READ
        )
      ).toBe(true);
      expect(
        adminChecker.hasPlantOperationPermission(
          "CCR",
          "Unit 2",
          PermissionLevel.WRITE
        )
      ).toBe(false);
    });

    test("Operator should have limited plant operation permissions", () => {
      expect(
        operatorChecker.hasPlantOperationPermission(
          "CCR",
          "Unit 1",
          PermissionLevel.WRITE
        )
      ).toBe(true);
      expect(
        operatorChecker.hasPlantOperationPermission(
          "CCR",
          "Unit 2",
          PermissionLevel.READ
        )
      ).toBe(false);
    });
  });

  describe("Null User Permissions", () => {
    const checker = new PermissionChecker(null);

    test("should have no permissions", () => {
      expect(checker.hasPermission("dashboard", PermissionLevel.READ)).toBe(
        false
      );
      expect(
        checker.hasPermission("user_management", PermissionLevel.READ)
      ).toBe(false);
      expect(
        checker.hasPermission("plant_operations", PermissionLevel.READ)
      ).toBe(false);
      expect(checker.hasPermission("packing_plant", PermissionLevel.READ)).toBe(
        false
      );
      expect(
        checker.hasPermission("project_management", PermissionLevel.READ)
      ).toBe(false);
      expect(
        checker.hasPermission("system_settings", PermissionLevel.READ)
      ).toBe(false);
    });
  });
});

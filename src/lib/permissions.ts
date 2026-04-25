export type UserRole = "admin" | "cashier" | "accountant";

export interface PagePermission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RolePermissions {
  pages: {
    [key: string]: PagePermission;
  };
  features: {
    canViewWholesalePrice: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    canManageShifts: boolean;
    canViewActivities: boolean;
  };
}

// Default permission (no access)
const noAccess: PagePermission = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

// Full access permission
const fullAccess: PagePermission = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
};

// View only permission (Custom helper if needed later)
const viewOnly: PagePermission = {
  canView: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

const restrictedPermissions: RolePermissions = {
  pages: {},
  features: {
    canViewWholesalePrice: false,
    canManageUsers: false,
    canViewReports: false,
    canManageShifts: false,
    canViewActivities: false,
  },
};

// Permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    pages: {
      dashboard: fullAccess,
      "create-order": fullAccess,
      orders: fullAccess,
      products: fullAccess,
      "shifts-page": fullAccess,
      "shift-summary": fullAccess,
      "wasted-products": fullAccess,
      scrap: fullAccess,
      factory: fullAccess,
      services: fullAccess,
      customers: fullAccess,
      suppliers: fullAccess,
      users: fullAccess,
      "weight-products": fullAccess,
      "payment-methods": fullAccess,
      accounting: fullAccess,
      activities: fullAccess,
      settings: fullAccess,
    },
    features: {
      canViewWholesalePrice: true,
      canManageUsers: true,
      canViewReports: true,
      canManageShifts: true,
      canViewActivities: true,
    },
  },
  cashier: {
    pages: {
      dashboard: noAccess, // Stats/Reports
      "create-order": fullAccess,
      orders: fullAccess,
      products: fullAccess,
      "shifts-page": noAccess,
      "shift-summary": fullAccess,
      "wasted-products": noAccess,
      scrap: noAccess,
      factory: noAccess,
      services: fullAccess,
      customers: fullAccess,
      "customers/*": noAccess,
      suppliers: fullAccess,
      users: noAccess,
      "weight-products": viewOnly,
      accounting: noAccess,
      "payment-methods": noAccess,
      activities: noAccess,
      settings: fullAccess,
    },
    features: {
      canViewWholesalePrice: false,
      canManageUsers: false,
      canViewReports: false,
      canManageShifts: false,
      canViewActivities: false,
    },
  },
  accountant: {
    pages: {
      dashboard: noAccess,
      "create-order": noAccess,
      orders: noAccess,
      products: noAccess,
      "shifts-page": noAccess,
      "shift-summary": noAccess,
      "wasted-products": noAccess,
      scrap: noAccess,
      factory: noAccess,
      services: noAccess,
      customers: noAccess,
      suppliers: noAccess,
      users: noAccess,
      "weight-products": noAccess,
      accounting: noAccess,
      "payment-methods": noAccess,
      activities: noAccess,
      settings: noAccess,
    },
    features: {
      canViewWholesalePrice: false,
      canManageUsers: false,
      canViewReports: false,
      canManageShifts: false,
      canViewActivities: false,
    },
  },
};

/**
 * Get permissions for a specific role
 */
export function getPermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role] || restrictedPermissions;
}

/**
 * Check if a role has access to a specific page
 */
export function canAccessPage(role: UserRole, page: string): boolean {
  const permissions = getPermissions(role);

  // Exact match first
  if (permissions.pages[page] !== undefined) {
    return permissions.pages[page].canView;
  }

  // For sub-pages like "customers/5"
  const segments = page.split("/");
  if (segments.length >= 2) {
    // Check wildcard match: "customers/*"
    const wildcardKey = segments[0] + "/*";
    if (permissions.pages[wildcardKey] !== undefined) {
      return permissions.pages[wildcardKey].canView;
    }

    // Fallback to parent page: "customers"
    const parentKey = segments[0];
    if (permissions.pages[parentKey] !== undefined) {
      return permissions.pages[parentKey].canView;
    }
  }

  return false;
}

/**
 * Check if a role can perform a specific action on a page
 */
export function canPerformAction(
  role: UserRole,
  page: string,
  action: "view" | "create" | "edit" | "delete",
): boolean {
  const permissions = getPermissions(role);
  const pagePermission = permissions.pages[page];

  if (!pagePermission) return false;

  switch (action) {
    case "view":
      return pagePermission.canView;
    case "create":
      return pagePermission.canCreate;
    case "edit":
      return pagePermission.canEdit;
    case "delete":
      return pagePermission.canDelete;
    default:
      return false;
  }
}

/**
 * Check if a role can view wholesale prices
 */
export function canViewWholesalePrice(role: UserRole): boolean {
  const permissions = getPermissions(role);
  return permissions.features.canViewWholesalePrice;
}

/**
 * Get list of accessible pages for a role
 */
export function getAccessiblePages(role: UserRole): string[] {
  const permissions = getPermissions(role);
  return Object.keys(permissions.pages).filter(
    (page) => permissions.pages[page].canView,
  );
}

'use strict';
const { RBAC_ROLES, ORG_ROLES } = require('../config/constants');

function hasPermission(user, requiredPermission) {
  if (!user || !user.role) return false;
  const roleSpec = RBAC_ROLES[user.role];
  if (!roleSpec) return false;
  if (roleSpec.permissions.includes('*')) return true;
  return roleSpec.permissions.includes(requiredPermission);
}

function isPlatformAdminRole(user) {
  if (!user || !user.role) return false;
  const spec = RBAC_ROLES[user.role];
  return Boolean(spec && spec.isAdmin);
}

function requireAuth(user) {
  if (!user) {
    const err = new Error('Vui lòng đăng nhập để thực hiện chức năng này.');
    err.statusCode = 401;
    throw err;
  }
  return user;
}

function requirePermission(user, permission) {
  requireAuth(user);
  if (!hasPermission(user, permission)) {
    const roleName = RBAC_ROLES[user.role]?.name || user.role;
    const err = new Error(`Từ chối truy cập: Vai trò '${roleName}' không được cấp quyền thực hiện thao tác này (${permission}).`);
    err.statusCode = 403;
    throw err;
  }
  return true;
}

/**
 * Kiểm tra quyền truy cập trong Tổ chức (PHẦN XI.3 & XI.4):
 * - 6 vai trò tách biệt: owner (head), manager, executive, coordinator, group_leader, member
 * - Thành viên thông thường ('member') chỉ được truy cập '/khong-gian-cua-toi', tuyệt đối không được thực hiện các thao tác quản lý tại '/to-chuc'.
 * - Cô lập hoàn toàn giữa Tổ chức A và Tổ chức B.
 */
function requireOrgAccess(db, user, orgId, requiredOrgRoles = ['owner', 'head', 'manager', 'executive', 'coordinator', 'group_leader', 'member']) {
  requireAuth(user);
  if (hasPermission(user, 'organizations.manage') || user.role === 'super_admin') {
    return { role: 'platform_admin', org_role: 'owner', role_name_vi: 'Quản trị viên Tổ chức Nền tảng' };
  }
  const member = db.get(
    `SELECT * FROM org_members WHERE org_id = ? AND user_id = ? AND status = 'active'`,
    [orgId, user.id]
  );
  if (!member || !requiredOrgRoles.includes(member.org_role)) {
    const err = new Error('Từ chối truy cập: Tài khoản của bạn không có quyền thực hiện thao tác quản lý này hoặc không thuộc đơn vị sở hữu dữ liệu.');
    err.statusCode = 403;
    throw err;
  }
  return Object.assign({}, member, {
    role_name_vi: ORG_ROLES[member.org_role]?.name || member.title || 'Thành viên'
  });
}

function requireOrgManagementAccess(db, user, orgId = null) {
  requireAuth(user);
  const managementRoles = ['owner', 'head', 'manager', 'executive', 'coordinator', 'group_leader'];
  if (hasPermission(user, 'organizations.manage') || user.role === 'super_admin') {
    return { authorized: true, org_role: 'platform_admin' };
  }
  if (orgId) {
    return requireOrgAccess(db, user, orgId, managementRoles);
  }
  const anyManagedOrg = db.get(
    `SELECT * FROM org_members WHERE user_id = ? AND status = 'active' AND org_role IN ('owner', 'head', 'manager', 'executive', 'coordinator', 'group_leader') LIMIT 1`,
    [user.id]
  );
  if (!anyManagedOrg) {
    const err = new Error('Từ chối truy cập Không gian Quản lý Tổ chức: Chỉ Chủ sở hữu, Người quản lý, Ban điều hành, Điều phối viên hoặc Người phụ trách nhóm mới có quyền truy cập khu vực này.');
    err.statusCode = 403;
    throw err;
  }
  return anyManagedOrg;
}

module.exports = {
  hasPermission,
  isPlatformAdminRole,
  requireAuth,
  requirePermission,
  requireOrgAccess,
  requireOrgManagementAccess
};

'use strict';
const { RBAC_ROLES } = require('../config/constants');

function hasPermission(user, requiredPermission) {
  if (!user || !user.role) return false;
  const roleSpec = RBAC_ROLES[user.role];
  if (!roleSpec) return false;
  if (roleSpec.permissions.includes('*')) return true;
  return roleSpec.permissions.includes(requiredPermission);
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
    const err = new Error(`Từ chối truy cập (RBAC Backend): Vai trò '${user.role}' không có quyền '${permission}'.`);
    err.statusCode = 403;
    throw err;
  }
  return true;
}

function requireOrgAccess(db, user, orgId, requiredOrgRoles = ['head', 'executive', 'coordinator', 'member']) {
  requireAuth(user);
  if (hasPermission(user, 'organizations.manage') || user.role === 'super_admin') {
    return { role: 'platform_admin' };
  }
  const member = db.get(
    `SELECT * FROM org_members WHERE org_id = ? AND user_id = ? AND status = 'active'`,
    [orgId, user.id]
  );
  if (!member || !requiredOrgRoles.includes(member.org_role)) {
    const err = new Error('Từ chối truy cập: Mỗi tổ chức chỉ được phép truy cập dữ liệu thuộc đơn vị của mình.');
    err.statusCode = 403;
    throw err;
  }
  return member;
}

module.exports = {
  hasPermission,
  requireAuth,
  requirePermission,
  requireOrgAccess
};

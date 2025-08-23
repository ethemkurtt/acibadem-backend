// seed/perm-utils.js
import { ROLES } from "./roles.js";

export function buildEffectivePerms(user) {
  const rolePerms = (user.roles || []).flatMap(r => ROLES[r] || []);
  const override = user.perms || [];
  return Array.from(new Set([...rolePerms, ...override]));
}

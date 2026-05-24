import { useEffect, useMemo, useState } from "react";
import { Card, Tab, Tabs, Form, Button, Badge, Alert, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import api from "../api";
import { canEdit, hasPermission, refreshPermissions } from "../utils/permissions";

// =====================================================================
// Permission Manager — single page for both ROLE-wise and USER-wise
// permission management. Uses Spatie's role/direct permission features.
// =====================================================================

const ACTION_META = {
  view:   { label: "View",   color: "info",      icon: "fa-eye" },
  create: { label: "Create", color: "success",   icon: "fa-plus" },
  edit:   { label: "Edit",   color: "warning",   icon: "fa-edit" },
  delete: { label: "Delete", color: "danger",    icon: "fa-trash" },
};

const getActionMeta = (permName) => {
  const action = permName.split("-").pop();
  return ACTION_META[action] || { label: action, color: "secondary", icon: "fa-check" };
};

// Extract scope label from permission name, e.g. "lead-categories-view" -> "Categories"
const getScopeLabel = (permName) => {
  const parts = permName.split("-");
  const action = parts.pop();
  // For standard actions, remove the action to get the scope
  if (ACTION_META[action]) {
    const scopeParts = parts;
    // Strip common module prefix if present (e.g. "lead" -> "leads" already aliased)
    if (scopeParts[0] === "lead") scopeParts.shift();
    if (scopeParts[0] === "leads") scopeParts.shift();
    return scopeParts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Leads";
  }
  // Non-standard action (e.g. all, team, direct, any) — keep everything before action
  const scope = parts.join("-");
  return scope.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// Group permissions by their module prefix (e.g. "items-view" -> "items")
const MODULE_ALIASES = {
  lead: "leads",
};

const groupPermissions = (permissions) => {
  const groups = {};
  permissions.forEach((p) => {
    const prefix = p.name.split("-")[0] || "general";
    const moduleKey = MODULE_ALIASES[prefix] || prefix;
    if (!groups[moduleKey]) groups[moduleKey] = [];
    groups[moduleKey].push(p);
  });
  // Sort groups alphabetically; sort permissions inside each group by action priority
  const order = ["view", "create", "edit", "delete"];
  Object.keys(groups).forEach((g) => {
    groups[g].sort((a, b) => {
      const ai = order.indexOf(a.name.split("-").pop());
      const bi = order.indexOf(b.name.split("-").pop());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  });
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
};

export default function PermissionManager() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [search, setSearch] = useState("");
  const canEditRoles = canEdit("roles");
  const canEditUsers = canEdit("users");

  // ---------- Load permissions, roles, users once ----------
  useEffect(() => {
    (async () => {
      try {
        setLoadingMeta(true);
        const [pRes, rRes, uRes] = await Promise.all([
          api.get("/permissions", { params: { page: 1, perPage: 5000 } }),
          api.get("/roles", { params: { page: 1, perPage: 5000 } }),
          api.get("/users", { params: { perPage: 5000 } }),
        ]);
        setPermissions(pRes.data.data || []);
        setRoles(rRes.data.data || []);
        setUsers(uRes.data.data || []);
      } catch (e) {
        toast.error("Failed to load permission data");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const groupedPermissions = useMemo(() => {
    if (!search) return groupPermissions(permissions);
    const filtered = permissions.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    return groupPermissions(filtered);
  }, [permissions, search]);

  if (loadingMeta) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" /> <span className="ms-2 text-muted">Loading…</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="page-title mb-1">Permission Manager</h4>
          <p className="page-subtitle">
            Manage what each role and user can access. Role permissions apply to everyone with that role; direct user permissions act as per-user overrides.
          </p>
        </div>
        <div className="position-relative" style={{ maxWidth: 280, width: "100%" }}>
          <i className="fas fa-search position-absolute text-muted" style={{ left: 12, top: "50%", transform: "translateY(-50%)", fontSize: ".85rem" }} />
          <Form.Control
            type="search"
            placeholder="Search permissions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-3 p-lg-4">
          <Tabs defaultActiveKey="role" className="mb-4 tab-btn-custom" mountOnEnter unmountOnExit>
            <Tab eventKey="role" title={<><i className="fas fa-user-shield me-2" />Role-wise</>}>
              <RoleTab
                roles={roles}
                groupedPermissions={groupedPermissions}
                canEdit={canEditRoles}
                onSaved={(updated) => {
                  setRoles((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
                }}
              />
            </Tab>
            <Tab eventKey="user" title={<><i className="fas fa-user-cog me-2" />User-wise</>}>
              <UserTab
                users={users}
                groupedPermissions={groupedPermissions}
                canEdit={canEditUsers}
              />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
}

/* =====================================================================
   ROLE TAB — pick a role, toggle permissions, bulk select per module.
   ===================================================================== */
function RoleTab({ roles, groupedPermissions, canEdit, onSaved }) {
  const [roleId, setRoleId] = useState(roles[0]?.id || "");
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load role's current permissions when role changes
  useEffect(() => {
    if (!roleId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/roles/${roleId}`);
        const ids = (res.data?.data?.permissions || []).map((p) => p.id);
        setSelected(new Set(ids));
      } catch {
        toast.error("Failed to load role permissions");
      } finally {
        setLoading(false);
      }
    })();
  }, [roleId]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (groupPerms, allChecked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      groupPerms.forEach((p) => (allChecked ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  };

  const save = async () => {
    if (!roleId) return;
    try {
      setSaving(true);
      const res = await api.post(`/roles/${roleId}/assign-permissions`, {
        permissions: Array.from(selected),
      });
      toast.success("Role permissions saved");
      onSaved?.(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const role = roles.find((r) => r.id === Number(roleId) || r.id === roleId);
  const isSuperAdmin = role?.name === "Super Admin";

  return (
    <>
      <div className="d-flex flex-column flex-md-row align-items-md-center gap-3 mb-3">
        <Form.Group style={{ minWidth: 260, maxWidth: 320 }} className="flex-grow-1 flex-md-grow-0">
          <Form.Label className="small fw-semibold text-muted mb-1">Select Role</Form.Label>
          <Form.Select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <div className="perm-stat-bar flex-grow-1 ms-md-auto">
          <span className="small text-muted d-flex align-items-center gap-2">
            <i className="fas fa-check-square text-primary" />
            <Badge bg="primary">{selected.size}</Badge>
            permissions selected
          </span>
          {canEdit && (
            <Button variant="primary" size="sm" onClick={save} disabled={saving || isSuperAdmin || loading} className="ms-md-auto">
              {saving ? <><Spinner animation="border" size="sm" className="me-1" />Saving…</> : <><i className="fas fa-save me-1" />Save Changes</>}
            </Button>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <Alert variant="warning" className="d-flex align-items-start gap-2 border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fde68a !important" }}>
          <i className="fas fa-crown text-amber mt-1" />
          <div className="small">
            <div className="fw-semibold">Super Admin</div>
            This role always has all permissions. Editing is disabled for safety.
          </div>
        </Alert>
      )}

      {loading ? (
        <PermissionSkeleton />
      ) : (
        <PermissionGrid
          groupedPermissions={groupedPermissions}
          selected={selected}
          onToggle={toggle}
          onToggleGroup={toggleGroup}
          disabled={!canEdit || isSuperAdmin}
        />
      )}
    </>
  );
}

/* =====================================================================
   USER TAB — pick a user, see role-derived perms (read-only) + edit
   direct (override) permissions.
   ===================================================================== */
function UserTab({ users, groupedPermissions, canEdit }) {
  const [userId, setUserId] = useState(users[0]?.id || "");
  const [details, setDetails] = useState(null);
  const [direct, setDirect] = useState(new Set());
  const [revoked, setRevoked] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/${userId}/permission-details`);
        const d = res.data?.data;
        setDetails(d);
        setDirect(new Set((d?.direct_permissions || []).map((p) => p.id)));
        setRevoked(new Set((d?.revoked_permissions || []).map((p) => p.id)));
      } catch {
        toast.error("Failed to load user permissions");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const rolePermIds = useMemo(
    () => new Set((details?.role_permissions || []).map((p) => p.id)),
    [details]
  );

  // Effective = (role + direct) - revoked
  const effectiveIds = useMemo(() => {
    const all = new Set([...rolePermIds, ...direct]);
    revoked.forEach((id) => all.delete(id));
    return all;
  }, [rolePermIds, direct, revoked]);

  const togglePermission = (id) => {
    const isInherited = rolePermIds.has(id);
    const isDirect = direct.has(id);
    const isRevoked = revoked.has(id);
    const isEffective = (isInherited || isDirect) && !isRevoked;

    if (isEffective) {
      // Unchecking: remove from direct OR add to revoked
      if (isDirect) {
        setDirect((prev) => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        setRevoked((prev) => { const n = new Set(prev); n.add(id); return n; });
      }
    } else {
      // Checking: remove from revoked OR add to direct
      if (isRevoked) {
        setRevoked((prev) => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        setDirect((prev) => { const n = new Set(prev); n.add(id); return n; });
      }
    }
  };

  const toggleGroup = (groupPerms, allEffective) => {
    groupPerms.forEach((p) => {
      const isEffective = effectiveIds.has(p.id);
      if (allEffective) {
        // Group is all-effective, we want to turn everything off
        if (isEffective) togglePermission(p.id);
      } else {
        // Group is not all-effective, we want to turn everything on
        if (!isEffective) togglePermission(p.id);
      }
    });
  };

  const save = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      await api.post(`/users/${userId}/sync-permissions`, {
        permissions: Array.from(direct),
        revoked_permissions: Array.from(revoked),
      });
      toast.success("User permissions saved");
      // Refresh current user's permissions so UI updates immediately
      await refreshPermissions();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const selectedUser = users.find((u) => u.id === Number(userId));
  const userInitials = selectedUser?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <>
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-5">
          <Form.Group>
            <Form.Label className="small fw-semibold text-muted mb-1">Search User</Form.Label>
            <div className="position-relative">
              <i className="fas fa-search position-absolute text-muted" style={{ left: 10, top: "50%", transform: "translateY(-50%)", fontSize: ".8rem" }} />
              <Form.Control type="search" placeholder="Name or email…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ paddingLeft: 30 }} />
            </div>
          </Form.Group>
        </div>
        <div className="col-12 col-md-5">
          <Form.Group>
            <Form.Label className="small fw-semibold text-muted mb-1">Select User</Form.Label>
            <Form.Select value={userId} onChange={(e) => setUserId(Number(e.target.value))}>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      {loading ? (
        <PermissionSkeleton />
      ) : details ? (
        <>
          <div className="user-info-card mb-3">
            <div className="user-avatar">{userInitials}</div>
            <div className="flex-grow-1">
              <div className="fw-semibold d-flex align-items-center flex-wrap gap-2">
                {details.user.name}
                {details.roles.map((r) => (
                  <Badge key={r.id} bg="primary" className="fw-medium">{r.name}</Badge>
                ))}
              </div>
              <div className="small text-muted">{details.user.email}</div>
              <div className="small text-muted mt-1">
                Toggle permissions to grant or revoke access. Permissions from roles are shown with a <strong>role</strong> badge. Revoked permissions override role grants.
              </div>
            </div>
          </div>

          <div className="perm-stat-bar mb-3">
            <span className="small text-muted d-flex align-items-center gap-2">
              <i className="fas fa-user-plus text-primary" />
              <Badge bg="primary">{direct.size}</Badge> direct
            </span>
            <span className="small text-muted d-flex align-items-center gap-2">
              <i className="fas fa-users text-secondary" />
              <Badge bg="secondary">{rolePermIds.size}</Badge> from roles
            </span>
            <span className="small text-muted d-flex align-items-center gap-2">
              <i className="fas fa-ban text-danger" />
              <Badge bg="danger">{revoked.size}</Badge> revoked
            </span>
            <span className="small text-muted d-flex align-items-center gap-2">
              <i className="fas fa-shield-alt text-success" />
              <Badge bg="success">{effectiveIds.size}</Badge> effective
            </span>
            {canEdit && (
              <Button variant="primary" size="sm" onClick={save} disabled={saving} className="ms-md-auto">
                {saving ? <><Spinner animation="border" size="sm" className="me-1" />Saving…</> : <><i className="fas fa-save me-1" />Save Changes</>}
              </Button>
            )}
          </div>

          <PermissionGrid
            groupedPermissions={groupedPermissions}
            selected={effectiveIds}
            onToggle={togglePermission}
            onToggleGroup={toggleGroup}
            disabled={!canEdit}
            inheritedIds={rolePermIds}
            revokedIds={revoked}
          />
        </>
      ) : (
        <div className="text-center text-muted py-5">
          <div className="empty-state">
            <i className="fas fa-user-slash empty-state-icon"></i>
            <div className="fw-semibold text-secondary">No user selected</div>
            <div className="small text-muted">Select a user to view and edit their permissions</div>
          </div>
        </div>
      )}
    </>
  );
}

/* =====================================================================
   PERMISSION SKELETON — loading placeholder for permission grid.
   ===================================================================== */
function PermissionSkeleton() {
  return (
    <div className="d-flex flex-column gap-3">
      {Array.from({ length: 5 }).map((_, gi) => (
        <div key={gi} className="perm-module-card">
          <div className="perm-module-header">
            <div className="module-icon"><i className="fas fa-folder" /></div>
            <div className="module-name">Loading…</div>
          </div>
          <div className="p-3">
            <div className="row g-2">
              {Array.from({ length: 4 }).map((__, pi) => (
                <div key={pi} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className="skeleton-row" style={{ height: 44, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================================
   PERMISSION GRID — shared between Role and User tabs.
   Renders module groups with bulk toggles and per-permission chips.
   ===================================================================== */
function PermissionGrid({
  groupedPermissions,
  selected,
  onToggle,
  onToggleGroup,
  disabled = false,
  inheritedIds = new Set(),
  revokedIds = new Set(),
}) {
  const groups = Object.entries(groupedPermissions);

  if (groups.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="empty-state">
          <i className="fas fa-search empty-state-icon"></i>
          <div className="fw-semibold text-secondary">No permissions match your search</div>
          <div className="small text-muted">Try a different search term</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {groups.map(([group, perms]) => {
        const allChecked = perms.every((p) => selected.has(p.id));
        const someChecked = perms.some((p) => selected.has(p.id));
        const selectedCount = perms.filter((p) => selected.has(p.id)).length;
        const inheritedCount = perms.filter((p) => inheritedIds.has(p.id)).length;
        return (
          <div key={group} className="perm-module-card">
            <div className="perm-module-header">
              <div className="module-icon"><i className="fas fa-layer-group" /></div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                  <span className="module-name">{group.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())}</span>
                  <Badge bg="light" text="dark" className="border fw-medium">
                    {selectedCount} / {perms.length}
                  </Badge>
                </div>
                <div className="progress mt-1" style={{ height: 4, maxWidth: 200 }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${perms.length ? (selectedCount / perms.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <Form.Check
                type="checkbox"
                checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                onChange={() => onToggleGroup(perms, allChecked)}
                disabled={disabled}
                id={`group-${group}`}
                title={allChecked ? "Uncheck all" : "Check all"}
              />
            </div>
            <div className="p-3">
              <div className="row g-2">
                {perms.map((p) => {
                  const checked = selected.has(p.id);
                  const inherited = inheritedIds.has(p.id);
                  const revoked = revokedIds.has(p.id);
                  const meta = getActionMeta(p.name);
                  const chipClasses = [
                    "perm-chip",
                    checked ? "active" : "",
                    revoked ? "perm-chip-revoked" : "",
                    disabled ? "perm-chip-disabled" : "",
                  ].filter(Boolean).join(" ");

                  return (
                    <div key={p.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div
                        className={chipClasses}
                        onClick={() => { if (!disabled) onToggle(p.id); }}
                        role="button"
                        tabIndex={disabled ? -1 : 0}
                        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled) { e.preventDefault(); onToggle(p.id); } }}
                      >
                        <input
                          type="checkbox"
                          className="m-0 flex-shrink-0 perm-checkbox"
                          checked={checked}
                          disabled={disabled}
                          readOnly
                          style={{ pointerEvents: "none" }}
                        />
                        <div className={`perm-icon perm-icon-${meta.color}`}>
                          <i className={`fas ${meta.icon}`} />
                        </div>
                        <span className="small fw-medium text-truncate flex-grow-1" title={p.name}>
                          <span className="text-muted">{getScopeLabel(p.name)}</span>
                          <span className="mx-1 text-secondary">·</span>
                          {meta.label}
                        </span>
                        {revoked && (
                          <Badge bg="danger" className="fw-medium ms-auto small">revoked</Badge>
                        )}
                        {!revoked && inherited && (
                          <Badge bg="light" text="dark" className="border fw-medium ms-auto small" title="Granted via role">role</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

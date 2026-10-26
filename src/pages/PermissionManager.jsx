import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import api from "../api";
import { canEdit, refreshPermissions } from "../utils/permissions";

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

const ACTION_CHIP_COLORS = {
  info:    { bg: '#e0f2fe', fg: '#0284c7' },
  success: { bg: '#dcfce7', fg: '#16a34a' },
  warning: { bg: '#fef3c7', fg: '#d97706' },
  danger:  { bg: '#fee2e2', fg: '#dc2626' },
};

const getActionChipColors = (color) => ACTION_CHIP_COLORS[color] || { bg: '#f1f5f9', fg: '#64748b' };

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

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(28,37,46,.05)',
};

export default function PermissionManager() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("role");
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
        setPermissions(toArray(pRes.data));
        setRoles(toArray(rRes.data));
        setUsers(toArray(uRes.data));
      } catch {
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading…</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Permission Manager
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
            Manage what each role and user can access. Role permissions apply to everyone with that role; direct user permissions act as per-user overrides.
          </Typography>
        </Box>
        <TextField
          size="small"
          type="search"
          placeholder="Search permissions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: '100%', md: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <i className="fas fa-search" style={{ fontSize: 13 }} aria-hidden="true" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Card sx={cardSx}>
        <CardContent sx={{ p: { xs: 2, lg: 3 } }}>
          <Tabs
            value={tab}
            onChange={(e, value) => setTab(value)}
            sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab
              value="role"
              label="Role-wise"
              icon={<i className="fas fa-user-shield" aria-hidden="true" />}
              iconPosition="start"
            />
            <Tab
              value="user"
              label="User-wise"
              icon={<i className="fas fa-user-cog" aria-hidden="true" />}
              iconPosition="start"
            />
          </Tabs>

          {tab === "role" && (
            <RoleTab
              roles={roles}
              groupedPermissions={groupedPermissions}
              canEdit={canEditRoles}
              onSaved={(updated) => {
                setRoles((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
              }}
            />
          )}
          {tab === "user" && (
            <UserTab
              users={users}
              groupedPermissions={groupedPermissions}
              canEdit={canEditUsers}
            />
          )}
        </CardContent>
      </Card>
    </Box>
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
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          gap: 2,
          mb: 2,
        }}
      >
        <FormControl size="small" sx={{ minWidth: { md: 260 }, maxWidth: { md: 320 }, width: { xs: '100%', md: 'auto' }, flexGrow: { xs: 1, md: 0 } }}>
          <InputLabel>Select Role</InputLabel>
          <Select
            label="Select Role"
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
          >
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flexGrow: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="fas fa-check-square" style={{ color: '#062849' }} aria-hidden="true" />
            <Chip size="small" label={selected.size} sx={{ bgcolor: '#eaf0f6', color: '#062849' }} />
            permissions selected
          </Typography>
          {canEdit && (
            <Button
              variant="contained"
              size="small"
              onClick={save}
              disabled={saving || isSuperAdmin || loading}
              sx={{ ml: { md: 'auto' } }}
              startIcon={saving ? <CircularProgress color="inherit" size={14} /> : <i className="fas fa-save" aria-hidden="true" />}
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          )}
        </Box>
      </Box>

      {isSuperAdmin && (
        <Alert
          severity="warning"
          sx={{ mb: 2, background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
          icon={<i className="fas fa-crown" aria-hidden="true" />}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Super Admin</Typography>
          <Typography variant="body2">This role always has all permissions. Editing is disabled for safety.</Typography>
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
    </Box>
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
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
          mb: 2,
        }}
      >
        <TextField
          size="small"
          type="search"
          label="Search User"
          placeholder="Name or email…"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <i className="fas fa-search" style={{ fontSize: 13 }} aria-hidden="true" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" fullWidth>
          <InputLabel>Select User</InputLabel>
          <Select
            label="Select User"
            value={userId}
            onChange={(e) => setUserId(Number(e.target.value))}
          >
            {filteredUsers.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.name} — {u.email}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <PermissionSkeleton />
      ) : details ? (
        <Box>
          <Paper
            variant="outlined"
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              p: 2,
              mb: 2,
              borderRadius: 2.5,
              bgcolor: '#f8fafc',
            }}
          >
            <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48, fontWeight: 700 }}>
              {userInitials}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {details.user.name}
                </Typography>
                {details.roles.map((r) => (
                  <Chip
                    key={r.id}
                    size="small"
                    label={r.name}
                    sx={{ bgcolor: '#eaf0f6', color: '#062849', fontWeight: 600 }}
                  />
                ))}
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {details.user.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Toggle permissions to grant or revoke access. Permissions from roles are shown with a <strong>role</strong> badge. Revoked permissions override role grants.
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="fas fa-user-plus" style={{ color: '#062849' }} aria-hidden="true" />
              <Chip size="small" label={direct.size} sx={{ bgcolor: '#eaf0f6', color: '#062849' }} /> direct
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="fas fa-users" style={{ color: '#637381' }} aria-hidden="true" />
              <Chip size="small" label={rolePermIds.size} sx={{ bgcolor: '#f1f5f9', color: '#475569' }} /> from roles
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="fas fa-ban" style={{ color: '#ff5630' }} aria-hidden="true" />
              <Chip size="small" label={revoked.size} sx={{ bgcolor: '#ffe4de', color: '#b71d18' }} /> revoked
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="fas fa-shield-alt" style={{ color: '#22c55e' }} aria-hidden="true" />
              <Chip size="small" label={effectiveIds.size} sx={{ bgcolor: '#dbf5e9', color: '#118d57' }} /> effective
            </Typography>
            {canEdit && (
              <Button
                variant="contained"
                size="small"
                onClick={save}
                disabled={saving}
                sx={{ ml: { md: 'auto' } }}
                startIcon={saving ? <CircularProgress color="inherit" size={14} /> : <i className="fas fa-save" aria-hidden="true" />}
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            )}
          </Box>

          <PermissionGrid
            groupedPermissions={groupedPermissions}
            selected={effectiveIds}
            onToggle={togglePermission}
            onToggleGroup={toggleGroup}
            disabled={!canEdit}
            inheritedIds={rolePermIds}
            revokedIds={revoked}
          />
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <i className="fas fa-user-slash" style={{ fontSize: 42, color: '#637381', opacity: 0.4 }} aria-hidden="true" />
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
            No user selected
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Select a user to view and edit their permissions
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/* =====================================================================
   PERMISSION SKELETON — loading placeholder for permission grid.
   ===================================================================== */
function PermissionSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, gi) => (
        <Paper key={gi} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.5,
              bgcolor: '#f8fafc',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Skeleton variant="rounded" width={28} height={28} />
            <Skeleton variant="text" width={140} />
          </Box>
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: 1.5,
              }}
            >
              {Array.from({ length: 4 }).map((__, pi) => (
                <Skeleton key={pi} variant="rounded" height={44} />
              ))}
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
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
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <i className="fas fa-search" style={{ fontSize: 42, color: '#637381', opacity: 0.4 }} aria-hidden="true" />
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1.5 }}>
          No permissions match your search
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Try a different search term
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {groups.map(([group, perms]) => {
        const allChecked = perms.every((p) => selected.has(p.id));
        const someChecked = perms.some((p) => selected.has(p.id));
        const selectedCount = perms.filter((p) => selected.has(p.id)).length;
        return (
          <Paper key={group} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                bgcolor: '#f8fafc',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: '#e9e4fd',
                  color: 'secondary.main',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                <i className="fas fa-layer-group" aria-hidden="true" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
                    {group.replace(/-/g, " ")}
                  </Typography>
                  <Chip size="small" variant="outlined" label={`${selectedCount} / ${perms.length}`} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={perms.length ? (selectedCount / perms.length) * 100 : 0}
                  sx={{ mt: 0.75, maxWidth: 200 }}
                />
              </Box>
              <Tooltip title={allChecked ? "Uncheck all" : "Check all"}>
                <span>
                  <Checkbox
                    size="small"
                    checked={allChecked}
                    indeterminate={!allChecked && someChecked}
                    onChange={() => onToggleGroup(perms, allChecked)}
                    disabled={disabled}
                    inputProps={{ 'aria-label': `${allChecked ? 'Uncheck' : 'Check'} all ${group} permissions` }}
                  />
                </span>
              </Tooltip>
            </Box>
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                  gap: 1.5,
                }}
              >
                {perms.map((p) => {
                  const checked = selected.has(p.id);
                  const inherited = inheritedIds.has(p.id);
                  const revoked = revokedIds.has(p.id);
                  const meta = getActionMeta(p.name);
                  const chipColors = getActionChipColors(meta.color);

                  return (
                    <Box
                      key={p.id}
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      aria-disabled={disabled}
                      onClick={() => { if (!disabled) onToggle(p.id); }}
                      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled) { e.preventDefault(); onToggle(p.id); } }}
                      title={p.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: checked ? 'secondary.main' : 'divider',
                        bgcolor: checked ? 'rgba(101,40,232,0.08)' : '#fff',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1,
                        minHeight: 44,
                        transition: 'all .15s ease',
                      }}
                    >
                      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {checked ? (
                          <i className="fas fa-check-square" style={{ color: '#6528e8', fontSize: 14 }} aria-hidden="true" />
                        ) : (
                          <i className="far fa-square" style={{ color: '#919eab', fontSize: 14 }} aria-hidden="true" />
                        )}
                      </Box>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: checked ? '#fff' : chipColors.bg,
                          color: chipColors.fg,
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                      >
                        <i className={`fas ${meta.icon}`} aria-hidden="true" />
                      </Box>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ flex: 1, fontWeight: 500, fontSize: '0.8rem', color: checked ? '#4b16b4' : 'text.primary' }}
                      >
                        <Box component="span" sx={{ color: 'text.secondary' }}>{getScopeLabel(p.name)}</Box>
                        <Box component="span" sx={{ mx: 0.5, color: 'grey.400' }}>·</Box>
                        {meta.label}
                      </Typography>
                      {revoked && (
                        <Chip size="small" label="revoked" sx={{ bgcolor: '#ffe4de', color: '#b71d18', ml: 'auto', flexShrink: 0 }} />
                      )}
                      {!revoked && inherited && (
                        <Tooltip title="Granted via role">
                          <Chip size="small" variant="outlined" label="role" sx={{ ml: 'auto', flexShrink: 0 }} />
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}

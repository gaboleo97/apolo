"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { ALL_MODULES } from "@apolo/core";

const ROLES = ["super_admin", "tenant_admin", "manager", "seller", "viewer"] as const;
const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  tenant_admin: "Admin del tenant",
  manager: "Encargado",
  seller: "Vendedor",
  viewer: "Solo lectura",
};
const moduleLabels: Record<string, string> = {
  inventory: "Inventario",
  sales: "Ventas",
  purchases: "Compras",
  accounting: "Contabilidad",
  arca: "Facturación",
  ai: "AI Analytics",
  clients: "Clientes",
  suppliers: "Proveedores",
};

type Tenant = { id: string; name: string; slug: string; country: string; plan: string };
type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  modules: string[] | null;
  isActive: boolean;
  tenantId: string;
  tenantName: string | null;
};

function toggle(list: string[], key: string): string[] {
  return list.includes(key) ? list.filter((m) => m !== key) : [...list, key];
}

export default function AdminPanel() {
  const [tab, setTab] = useState(0);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  function notify(msg: string, sev: "success" | "error") {
    setSnack({ msg, sev });
  }

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("AR");
  const [plan, setPlan] = useState("freemium");

  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPassword, setUPassword] = useState("");
  const [uTenantId, setUTenantId] = useState("");
  const [uRole, setURole] = useState("tenant_admin");
  const [uModules, setUModules] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [tRes, uRes] = await Promise.all([fetch("/api/admin/tenants"), fetch("/api/admin/users")]);
    if (tRes.ok) setTenants((await tRes.json()).tenants);
    if (uRes.ok) setUsers((await uRes.json()).users);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country, plan, slug: slug.trim() || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data.error ?? "No se pudo crear el tenant", "error");
      return;
    }
    setName("");
    setSlug("");
    load();
    notify("Tenant creado", "success");
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: uTenantId,
        name: uName,
        email: uEmail,
        password: uPassword,
        role: uRole,
        modules: uModules,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data.error ?? "No se pudo crear el usuario", "error");
      return;
    }
    setUName("");
    setUEmail("");
    setUPassword("");
    setUModules([]);
    load();
    notify("Usuario creado", "success");
  }

  async function handleSaveUser(u: AdminUser, patch: Partial<AdminUser>) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      notify("No se pudo guardar el usuario", "error");
      return;
    }
    load();
    notify("Usuario actualizado", "success");
  }

  async function handleSaveTenant(t: Tenant) {
    const res = await fetch(`/api/admin/tenants/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: t.name, slug: t.slug, country: t.country, plan: t.plan }),
    });
    if (!res.ok) {
      notify("No se pudo guardar el tenant", "error");
      return;
    }
    load();
    notify("Tenant actualizado", "success");
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Administración
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gestión global de tenants y usuarios (solo super admin).
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Tenants" />
        <Tab label="Usuarios" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Nuevo tenant</Typography>
            <Box component="form" onSubmit={handleCreateTenant} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required size="small" sx={{ flex: 1, minWidth: 200 }} />
              <TextField label="Código (slug)" value={slug} onChange={(e) => setSlug(e.target.value)} size="small" sx={{ minWidth: 160 }} placeholder="ej. fuzion" helperText="Opcional; si lo dejás vacío se genera" />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>País</InputLabel>
                <Select label="País" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {["AR", "MX", "CO", "CL", "PE", "US"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Plan</InputLabel>
                <Select label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
                  {["freemium", "starter", "business", "enterprise"].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" disableElevation>Crear tenant</Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Tenants ({tenants.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>País</TableCell>
                  <TableCell>Plan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={t.name}
                        onChange={(e) => setTenants((prev) => prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))}
                        sx={{ minWidth: 140 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={t.slug}
                        onChange={(e) => setTenants((prev) => prev.map((x) => (x.id === t.id ? { ...x, slug: e.target.value } : x)))}
                        sx={{ minWidth: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 90 }}>
                        <InputLabel>País</InputLabel>
                        <Select
                          label="País"
                          value={t.country}
                          onChange={(e) => setTenants((prev) => prev.map((x) => (x.id === t.id ? { ...x, country: e.target.value } : x)))}
                        >
                          {["AR", "MX", "CO", "CL", "PE", "US"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Plan</InputLabel>
                        <Select
                          label="Plan"
                          value={t.plan}
                          onChange={(e) => setTenants((prev) => prev.map((x) => (x.id === t.id ? { ...x, plan: e.target.value } : x)))}
                        >
                          {["freemium", "starter", "business", "enterprise"].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => handleSaveTenant(t)}>
                        Guardar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Crear usuario</Typography>
            <Box component="form" onSubmit={handleCreateUser} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Tenant</InputLabel>
                  <Select label="Tenant" value={uTenantId} onChange={(e) => setUTenantId(e.target.value)} required>
                    {tenants.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Nombre" value={uName} onChange={(e) => setUName(e.target.value)} required size="small" sx={{ flex: 1, minWidth: 180 }} />
                <TextField label="Email" type="email" value={uEmail} onChange={(e) => setUEmail(e.target.value)} required size="small" sx={{ flex: 1, minWidth: 200 }} />
                <TextField label="Contraseña" type="password" value={uPassword} onChange={(e) => setUPassword(e.target.value)} required size="small" sx={{ flex: 1, minWidth: 160 }} />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Rol</InputLabel>
                  <Select label="Rol" value={uRole} onChange={(e) => setURole(e.target.value)}>
                    {ROLES.map((r) => <MenuItem key={r} value={r}>{roleLabels[r]}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {ALL_MODULES.map((m) => (
                  <FormControlLabel
                    key={m}
                    control={
                      <Checkbox
                        size="small"
                        checked={uModules.includes(m)}
                        onChange={() => setUModules((prev) => toggle(prev, m))}
                      />
                    }
                    label={moduleLabels[m]}
                  />
                ))}
              </Box>
              <Box>
                <Button type="submit" variant="contained" disableElevation>Crear usuario</Button>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Usuarios ({users.length})</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Módulos</TableCell>
                <TableCell>Activo</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{u.name ?? "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Tenant</InputLabel>
                      <Select
                        label="Tenant"
                        value={u.tenantId}
                        onChange={(e) => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, tenantId: e.target.value } : x)))}
                      >
                        {tenants.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Rol</InputLabel>
                      <Select
                        label="Rol"
                        value={u.role}
                        onChange={(e) => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: e.target.value } : x)))}
                      >
                        {ROLES.map((r) => <MenuItem key={r} value={r}>{roleLabels[r]}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", maxWidth: 320 }}>
                      {ALL_MODULES.map((m) => (
                        <FormControlLabel
                          key={m}
                          control={
                            <Checkbox
                              size="small"
                              checked={(u.modules ?? []).includes(m)}
                              onChange={() => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, modules: toggle(x.modules ?? [], m) } : x)))}
                            />
                          }
                          label={moduleLabels[m]}
                          sx={{ fontSize: 12 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      size="small"
                      checked={u.isActive}
                      onChange={(e) => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: e.target.checked } : x)))}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleSaveUser(u, { tenantId: u.tenantId, role: u.role, modules: u.modules ?? [], isActive: u.isActive })}
                    >
                      Guardar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Paper>
        </Box>
      )}

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack?.sev} variant="filled" onClose={() => setSnack(null)}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

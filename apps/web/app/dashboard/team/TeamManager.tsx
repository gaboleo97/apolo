"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import { ALL_MODULES } from "@apolo/core";

const ROLES = ["tenant_admin", "manager", "seller", "viewer"] as const;

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

type TeamUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  modules: string[] | null;
  isActive: boolean;
};

export default function TeamManager() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("seller");
  const [modules, setModules] = useState<string[]>(["sales"]);

  const load = useCallback(async () => {
    const res = await fetch("/api/team");
    if (!res.ok) {
      setError("No se pudieron cargar los usuarios");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleModule(list: string[], key: string): string[] {
    return list.includes(key) ? list.filter((m) => m !== key) : [...list, key];
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, modules }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear el usuario");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setRole("seller");
    setModules(["sales"]);
    load();
  }

  async function handleSave(u: TeamUser, nextRole: string, nextModules: string[]) {
    setSavingId(u.id);
    setError(null);
    const res = await fetch(`/api/team/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole, modules: nextModules }),
    });
    setSavingId(null);
    if (!res.ok) {
      setError("No se pudo guardar el usuario");
      return;
    }
    load();
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Equipo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Administrá los usuarios de tu empresa: rol y módulos que cada uno puede ver.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Nuevo usuario
        </Typography>
        <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required size="small" sx={{ flex: 1, minWidth: 200 }} />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required size="small" sx={{ flex: 1, minWidth: 200 }} />
            <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required size="small" sx={{ flex: 1, minWidth: 160 }} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Rol</InputLabel>
              <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{roleLabels[r]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {ALL_MODULES.map((m) => (
              <FormControlLabel
                key={m}
                control={
                  <Checkbox
                    size="small"
                    checked={modules.includes(m)}
                    onChange={() => setModules((prev) => toggleModule(prev, m))}
                  />
                }
                label={moduleLabels[m]}
              />
            ))}
          </Box>
          <Box>
            <Button type="submit" variant="contained" disableElevation>
              Crear usuario
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Usuarios ({users.length})
        </Typography>
        {loading && <Typography color="text.secondary">Cargando...</Typography>}
        {!loading &&
          users.map((u) => (
            <Box key={u.id} sx={{ py: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 180 }}>
                  <Typography sx={{ fontWeight: 600 }}>{u.name ?? "Sin nombre"}</Typography>
                  <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    label="Rol"
                    value={u.role}
                    onChange={(e) => {
                      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: e.target.value } : x)));
                    }}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>{roleLabels[r]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={savingId === u.id}
                  onClick={() => handleSave(u, u.role, u.modules ?? [])}
                >
                  Guardar
                </Button>
              </Box>
              <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {ALL_MODULES.map((m) => (
                  <FormControlLabel
                    key={m}
                    control={
                      <Checkbox
                        size="small"
                        checked={(u.modules ?? []).includes(m)}
                        onChange={() =>
                          setUsers((prev) =>
                            prev.map((x) =>
                              x.id === u.id
                                ? { ...x, modules: toggleModule(x.modules ?? [], m) }
                                : x
                            )
                          )
                        }
                      />
                    }
                    label={moduleLabels[m]}
                  />
                ))}
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
      </Paper>
    </Box>
  );
}

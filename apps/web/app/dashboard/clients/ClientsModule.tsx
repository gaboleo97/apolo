"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
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
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

type Client = {
  id: string;
  name: string;
  clientType: "retail" | "wholesale" | "business";
  taxId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactName: string | null;
  notes: string | null;
  isActive: boolean;
};

const typeLabels: Record<string, string> = {
  retail: "Mostrador",
  wholesale: "Mayorista",
  business: "Comercio del barrio",
};

const typeColors: Record<string, "default" | "primary" | "secondary"> = {
  retail: "default",
  wholesale: "primary",
  business: "secondary",
};

const emptyForm = {
  name: "",
  clientType: "retail",
  taxId: "",
  phone: "",
  email: "",
  address: "",
  contactName: "",
  notes: "",
};

export default function ClientsModule() {
  const [tab, setTab] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<{ created: number; updated: number; errors: { line: number; error: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  function notify(msg: string, sev: "success" | "error") {
    setSnack({ msg, sev });
  }

  const loadClients = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/clients?${params}`);
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients);
    }
  }, [search]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm({
      name: c.name,
      clientType: c.clientType,
      taxId: c.taxId ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      contactName: c.contactName ?? "",
      notes: c.notes ?? "",
    });
    setOpenForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      clientType: form.clientType,
      taxId: form.taxId || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      contactName: form.contactName || null,
      notes: form.notes || null,
    };
    const res = await fetch(editing ? `/api/clients/${editing.id}` : "/api/clients", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notify(data.error ?? "Error al guardar", "error");
      return;
    }
    setOpenForm(false);
    notify(editing ? "Cliente actualizado" : "Cliente creado", "success");
    loadClients();
  }

  async function handleToggle(c: Client) {
    const res = await fetch(`/api/clients/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (!res.ok) {
      notify("Error al actualizar", "error");
      return;
    }
    loadClients();
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/clients/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Error al importar", "error");
        return;
      }
      setReport(data.report);
      notify("Importación finalizada", "success");
      loadClients();
    } finally {
      setImporting(false);
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Clientes</Typography>
        <Button variant="contained" onClick={openCreate} disableElevation>
          Nuevo cliente
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Clientes" />
        <Tab label="Carga masiva" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Buscar por nombre o CUIT/DNI"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 400 }}
          />
          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>CUIT / DNI</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                        No hay clientes. Creá uno o usá la carga masiva.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={typeLabels[c.clientType]} color={typeColors[c.clientType]} variant="outlined" />
                    </TableCell>
                    <TableCell>{c.taxId ?? "—"}</TableCell>
                    <TableCell>{c.phone ?? "—"}</TableCell>
                    <TableCell>{c.email ?? "—"}</TableCell>
                    <TableCell>
                      <Checkbox size="small" checked={c.isActive} onChange={() => handleToggle(c)} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => openEdit(c)}>
                        Editar
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
        <Box sx={{ maxWidth: 640 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Carga masiva de clientes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Columnas: nombre, tipo (mostrador/mayorista/comercio), cuit_dni, telefono, email, direccion, contacto, notas, activo. Si el cliente ya existe (por nombre), se actualiza en vez de duplicarse.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button variant="outlined" href="/api/clients/template" component="a">
                  Descargar plantilla
                </Button>
                <Button variant="outlined" href="/api/clients/export" component="a">
                  Exportar clientes
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Button variant="contained" component="label" disableElevation>
                  Elegir archivo
                  <input type="file" accept=".csv,text/csv" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {file ? file.name : "Ningún archivo seleccionado"}
                </Typography>
              </Box>
              <Button variant="contained" onClick={handleImport} disabled={importing || !file} disableElevation>
                {importing ? "Cargando..." : "Cargar archivo"}
              </Button>
            </Box>
            {report && (
              <Box sx={{ mt: 2 }}>
                <Typography>✅ Creados: {report.created} · ♻️ Actualizados: {report.updated}</Typography>
                {report.errors.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="error">Errores ({report.errors.length}):</Typography>
                    {report.errors.map((e, i) => (
                      <Typography key={i} variant="body2" color="text.secondary">
                        Fila {e.line}: {e.error}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      )}

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Nombre"
              size="small"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Tipo de cliente</InputLabel>
                <Select
                  label="Tipo de cliente"
                  value={form.clientType}
                  onChange={(e) => setForm({ ...form, clientType: e.target.value })}
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="CUIT / DNI"
                size="small"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Teléfono"
                size="small"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Email"
                size="small"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Dirección"
                size="small"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Persona de contacto"
                size="small"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              label="Notas"
              size="small"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button variant="contained" type="submit" disableElevation>
              Guardar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

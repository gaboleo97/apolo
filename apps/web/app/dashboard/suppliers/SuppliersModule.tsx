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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

type Supplier = {
  id: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactName: string | null;
  notes: string | null;
  isActive: boolean;
};

type LinkedProduct = {
  id: string;
  productId: string;
  code: string | null;
  cost: number | null;
  productName: string;
  productSku: string | null;
  inventoryCostPerUnit: number | null;
};

type ProductOption = { id: string; name: string; sku: string | null };

const emptyForm = {
  name: "",
  taxId: "",
  phone: "",
  email: "",
  address: "",
  contactName: "",
  notes: "",
};

export default function SuppliersModule() {
  const [tab, setTab] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);

  // tab productos
  const [selectedId, setSelectedId] = useState("");
  const [linked, setLinked] = useState<LinkedProduct[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [linkProductId, setLinkProductId] = useState("");
  const [linkCost, setLinkCost] = useState("");
  const [linkCode, setLinkCode] = useState("");

  // carga masiva
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<{ created: number; updated: number; errors: { line: number; error: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  function notify(msg: string, sev: "success" | "error") {
    setSnack({ msg, sev });
  }

  const loadSuppliers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/suppliers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setSuppliers(data.suppliers);
    }
  }, [search]);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/inventory/products");
    if (res.ok) {
      const data = await res.json();
      setProductOptions(data.products.map((p: ProductOption & { isActive: boolean }) => ({ id: p.id, name: p.name, sku: p.sku })));
    }
  }, []);

  const loadLinked = useCallback(async () => {
    if (!selectedId) {
      setLinked([]);
      return;
    }
    const res = await fetch(`/api/suppliers/${selectedId}/products`);
    if (res.ok) {
      const data = await res.json();
      setLinked(data.products);
    }
  }, [selectedId]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    loadLinked();
  }, [loadLinked]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      taxId: s.taxId ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
      contactName: s.contactName ?? "",
      notes: s.notes ?? "",
    });
    setOpenForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      taxId: form.taxId || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      contactName: form.contactName || null,
      notes: form.notes || null,
    };
    const res = await fetch(editing ? `/api/suppliers/${editing.id}` : "/api/suppliers", {
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
    notify(editing ? "Proveedor actualizado" : "Proveedor creado", "success");
    loadSuppliers();
  }

  async function handleToggle(s: Supplier) {
    const res = await fetch(`/api/suppliers/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (!res.ok) {
      notify("Error al actualizar", "error");
      return;
    }
    loadSuppliers();
  }

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !linkProductId) return;
    const res = await fetch(`/api/suppliers/${selectedId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: linkProductId,
        cost: linkCost ? Number(linkCost) : null,
        code: linkCode || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data.error ?? "Error al vincular", "error");
      return;
    }
    setLinkProductId("");
    setLinkCost("");
    setLinkCode("");
    notify("Producto vinculado", "success");
    loadLinked();
  }

  async function handleUnlink(productId: string) {
    const res = await fetch(`/api/suppliers/${selectedId}/products`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
      notify("Error al desvincular", "error");
      return;
    }
    notify("Producto desvinculado", "success");
    loadLinked();
  }

  function openProducts(s: Supplier) {
    setSelectedId(s.id);
    loadProducts();
    setTab(1);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/suppliers/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Error al importar", "error");
        return;
      }
      setReport(data.report);
      notify("Importación finalizada", "success");
      loadSuppliers();
    } finally {
      setImporting(false);
    }
  }

  const selectedSupplier = suppliers.find((s) => s.id === selectedId);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Proveedores</Typography>
        <Button variant="contained" onClick={openCreate} disableElevation>
          Nuevo proveedor
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Proveedores" />
        <Tab label="Productos" />
        <Tab label="Carga masiva" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Buscar por nombre o CUIT"
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
                  <TableCell>CUIT / Tax ID</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                        No hay proveedores. Creá uno o usá la carga masiva.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.taxId ?? "—"}</TableCell>
                    <TableCell>{s.phone ?? "—"}</TableCell>
                    <TableCell>{s.email ?? "—"}</TableCell>
                    <TableCell>{s.contactName ?? "—"}</TableCell>
                    <TableCell>
                      <Checkbox size="small" checked={s.isActive} onChange={() => handleToggle(s)} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button size="small" onClick={() => openEdit(s)}>
                          Editar
                        </Button>
                        <Button size="small" onClick={() => openProducts(s)}>
                          Productos
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 900 }}>
          <FormControl size="small">
            <InputLabel>Proveedor</InputLabel>
            <Select
              label="Proveedor"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedId && (
            <>
              <Paper component="form" onSubmit={handleLink} sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                <FormControl size="small" sx={{ minWidth: 220, flex: 2 }}>
                  <InputLabel>Producto del inventario</InputLabel>
                  <Select
                    label="Producto del inventario"
                    value={linkProductId}
                    onChange={(e) => setLinkProductId(e.target.value)}
                    required
                  >
                    {productOptions.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                        {p.sku ? ` (${p.sku})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Costo del proveedor"
                  size="small"
                  type="number"
                  value={linkCost}
                  onChange={(e) => setLinkCost(e.target.value)}
                  sx={{ width: 180 }}
                />
                <TextField
                  label="Código en el proveedor"
                  size="small"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  sx={{ width: 200 }}
                />
                <Button variant="contained" type="submit" disableElevation>
                  Vincular
                </Button>
              </Paper>

              <Paper>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Cód. proveedor</TableCell>
                      <TableCell align="right">Costo proveedor</TableCell>
                      <TableCell align="right">Costo inventario (unit.)</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {linked.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                            No hay productos vinculados a este proveedor.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {linked.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.productName}</TableCell>
                        <TableCell>{l.productSku ?? "—"}</TableCell>
                        <TableCell>{l.code ?? "—"}</TableCell>
                        <TableCell align="right">{l.cost != null ? `$${l.cost.toFixed(2)}` : "—"}</TableCell>
                        <TableCell align="right">
                          {l.inventoryCostPerUnit != null ? `$${l.inventoryCostPerUnit.toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="small" color="error" onClick={() => handleUnlink(l.productId)}>
                            Desvincular
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}
          {!selectedId && selectedSupplier == null && (
            <Typography color="text.secondary">Elegí un proveedor para ver y vincular sus productos.</Typography>
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ maxWidth: 640 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Carga masiva de proveedores</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Columnas: nombre, cuit, telefono, email, direccion, contacto, notas, activo. Si el proveedor ya existe (por nombre), se actualiza en vez de duplicarse.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button variant="outlined" href="/api/suppliers/template" component="a">
                  Descargar plantilla
                </Button>
                <Button variant="outlined" href="/api/suppliers/export" component="a">
                  Exportar proveedores
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
          <DialogTitle>{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
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
              <TextField
                label="CUIT / RUT / RFC"
                size="small"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Teléfono"
                size="small"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Email"
                size="small"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              label="Dirección"
              size="small"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
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

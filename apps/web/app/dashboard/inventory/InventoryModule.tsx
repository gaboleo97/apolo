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

const unitLabels: Record<string, string> = {
  unit: "Unidad",
  kg: "Kilogramo",
  lt: "Litro",
  m: "Metro",
  box: "Caja",
  pack: "Pack",
};

const stockTypeLabels: Record<string, string> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
};

type Category = { id: string; name: string; slug: string; description: string | null };
type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  price: number;
  cost: number | null;
  taxRate: number;
  unitType: string;
  minStock: number;
  currentStock: number;
  isActive: boolean;
  description: string | null;
};
type Movement = {
  id: string;
  productId: string;
  productName: string | null;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
};

const emptyForm = {
  name: "",
  categoryId: "",
  price: "",
  cost: "",
  taxRate: "21",
  sku: "",
  barcode: "",
  unitType: "unit",
  minStock: "0",
  description: "",
};

export default function InventoryModule() {
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const [stockProductId, setStockProductId] = useState("");
  const [stockType, setStockType] = useState("in");
  const [stockQty, setStockQty] = useState("1");
  const [stockNotes, setStockNotes] = useState("");

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<{ created: number; updated: number; errors: { line: number; error: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  function notify(msg: string, sev: "success" | "error") {
    setSnack({ msg, sev });
  }

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    const res = await fetch(`/api/inventory/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setCategories(data.categories);
    }
  }, [search, categoryFilter]);

  const loadMovements = useCallback(async () => {
    const res = await fetch("/api/inventory/stock");
    if (res.ok) {
      const data = await res.json();
      setMovements(data.movements);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadMovements();
  }, [loadProducts, loadMovements]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      categoryId: p.categoryId ?? "",
      price: String(p.price),
      cost: p.cost != null ? String(p.cost) : "",
      taxRate: String(p.taxRate),
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      unitType: p.unitType,
      minStock: String(p.minStock),
      description: p.description ?? "",
    });
    setOpenForm(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      categoryId: form.categoryId || null,
      price: Number(form.price),
      cost: form.cost ? Number(form.cost) : null,
      taxRate: Number(form.taxRate || 0),
      sku: form.sku || null,
      barcode: form.barcode || null,
      unitType: form.unitType,
      minStock: Number(form.minStock || 0),
      description: form.description || null,
    };

    const res = await fetch(editing ? `/api/inventory/products/${editing.id}` : "/api/inventory/products", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      notify(editing ? "Producto actualizado" : "Producto creado", "success");
      setOpenForm(false);
      loadProducts();
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.error ?? "No se pudo guardar el producto", "error");
    }
  }

  async function handleToggleProduct(p: Product) {
    const res = await fetch(`/api/inventory/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) {
      notify(p.isActive ? "Producto deshabilitado" : "Producto habilitado", "success");
      loadProducts();
    } else {
      notify("No se pudo actualizar el producto", "error");
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/inventory/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName, description: catDesc || null }),
    });
    if (res.ok) {
      notify("Categoría creada", "success");
      setCatName("");
      setCatDesc("");
      loadProducts();
    } else {
      notify("No se pudo crear la categoría", "error");
    }
  }

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/inventory/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: stockProductId,
        type: stockType,
        quantity: Number(stockQty),
        notes: stockNotes || null,
      }),
    });
    if (res.ok) {
      notify("Stock actualizado", "success");
      setStockNotes("");
      setStockQty("1");
      loadProducts();
      loadMovements();
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.error ?? "No se pudo ajustar el stock", "error");
    }
  }

  async function handleImport() {
    if (!importFile) {
      notify("Seleccioná un archivo CSV primero", "error");
      return;
    }
    setImporting(true);
    setImportReport(null);

    const formData = new FormData();
    formData.append("file", importFile);

    const res = await fetch("/api/inventory/products/import", {
      method: "POST",
      body: formData,
    });

    setImporting(false);

    if (res.ok) {
      const data = await res.json();
      setImportReport(data.report);
      notify(`Carga completada: ${data.report.created} creados, ${data.report.updated} actualizados`, "success");
      setImportFile(null);
      loadProducts();
      loadMovements();
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.error ?? "No se pudo importar el archivo", "error");
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Inventario
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Controlá productos, categorías y movimientos de stock.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Productos" />
        <Tab label="Categorías" />
        <Tab label="Stock" />
        <Tab label="Carga masiva" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Buscar"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Categoría</InputLabel>
              <Select
                label="Categoría"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" disableElevation onClick={openCreate} sx={{ ml: "auto" }}>
              Nuevo producto
            </Button>
          </Paper>

          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Costo</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.sku ?? "—"}</TableCell>
                    <TableCell>{categoryName(p.categoryId)}</TableCell>
                    <TableCell align="right">${p.price.toFixed(2)}</TableCell>
                    <TableCell align="right">{p.cost != null ? `$${p.cost.toFixed(2)}` : "—"}</TableCell>
                    <TableCell align="right">{p.currentStock}</TableCell>
                    <TableCell>
                      <Checkbox size="small" checked={p.isActive} onChange={() => handleToggleProduct(p)} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => openEdit(p)}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      No hay productos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Paper sx={{ p: 3, minWidth: 300 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Nueva categoría</Typography>
            <Box component="form" onSubmit={handleCreateCategory} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Nombre" size="small" value={catName} onChange={(e) => setCatName(e.target.value)} required />
              <TextField label="Descripción" size="small" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} multiline minRows={2} />
              <Button type="submit" variant="contained" disableElevation>Crear categoría</Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Categorías ({categories.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.description ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Paper sx={{ p: 3, minWidth: 300 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Ajustar stock</Typography>
            <Box component="form" onSubmit={handleAdjustStock} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl size="small" required>
                <InputLabel>Producto</InputLabel>
                <Select label="Producto" value={stockProductId} onChange={(e) => setStockProductId(e.target.value)}>
                  {products.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name} (stock: {p.currentStock})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Tipo</InputLabel>
                <Select label="Tipo" value={stockType} onChange={(e) => setStockType(e.target.value)}>
                  <MenuItem value="in">Entrada</MenuItem>
                  <MenuItem value="out">Salida</MenuItem>
                  <MenuItem value="adjustment">Ajuste</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Cantidad" size="small" type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} required />
              <TextField label="Notas" size="small" value={stockNotes} onChange={(e) => setStockNotes(e.target.value)} />
              <Button type="submit" variant="contained" disableElevation>Guardar movimiento</Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Movimientos ({movements.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>Notas</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.productName ?? "—"}</TableCell>
                    <TableCell>{stockTypeLabels[m.type] ?? m.type}</TableCell>
                    <TableCell align="right">{m.type === "out" ? `-${m.quantity}` : `+${m.quantity}`}</TableCell>
                    <TableCell>{m.notes ?? "—"}</TableCell>
                    <TableCell>{new Date(m.createdAt).toLocaleString("es-AR")}</TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      Sin movimientos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}

      {tab === 3 && (
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Paper sx={{ p: 3, minWidth: 320 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Carga masiva de productos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              1. Descargá la plantilla, completala y subila. Si un producto ya existe (por SKU, código de barras o nombre), se actualiza en vez de duplicarse.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button variant="outlined" href="/api/inventory/products/template" component="a">
                  Descargar plantilla
                </Button>
                <Button variant="outlined" href="/api/inventory/products/export" component="a">
                  Exportar productos
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Button variant="contained" component="label" disableElevation>
                  Elegir archivo
                  <input type="file" accept=".csv,text/csv" hidden onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {importFile ? importFile.name : "Ningún archivo seleccionado"}
                </Typography>
              </Box>
              <Button variant="contained" onClick={handleImport} disabled={importing || !importFile} disableElevation>
                {importing ? "Cargando..." : "Cargar archivo"}
              </Button>
            </Box>
          </Paper>

          {importReport && (
            <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Resultado</Typography>
              <Typography>✅ Creados: {importReport.created}</Typography>
              <Typography>♻️ Actualizados: {importReport.updated}</Typography>
              {importReport.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="error">Errores ({importReport.errors.length}):</Typography>
                  {importReport.errors.map((e, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      Fila {e.line}: {e.error}
                    </Typography>
                  ))}
                </Box>
              )}
            </Paper>
          )}
        </Box>
      )}

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        <Box component="form" onSubmit={handleSaveProduct}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Nombre" size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Categoría</InputLabel>
                <Select label="Categoría" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <MenuItem value="">Sin categoría</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Unidad</InputLabel>
                <Select label="Unidad" value={form.unitType} onChange={(e) => setForm({ ...form, unitType: e.target.value })}>
                  {Object.entries(unitLabels).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Precio" size="small" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required sx={{ flex: 1 }} />
              <TextField label="Costo" size="small" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="IVA (%)" size="small" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} sx={{ flex: 1 }} />
              <TextField label="Stock mínimo" size="small" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="SKU" size="small" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} sx={{ flex: 1 }} />
              <TextField label="Código de barras" size="small" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} sx={{ flex: 1 }} />
            </Box>
            <TextField label="Descripción" size="small" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={2} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disableElevation>
              {editing ? "Guardar" : "Crear"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack?.sev} variant="filled" onClose={() => setSnack(null)}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

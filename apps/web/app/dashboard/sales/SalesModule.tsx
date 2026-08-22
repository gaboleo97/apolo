"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";

type SaleRow = {
  id: string;
  code: string;
  status: "draft" | "confirmed" | "cancelled" | string;
  total: number;
  paid: number;
  balance: number;
  clientName: string | null;
  itemCount: number;
  createdAt: string | null;
};

type ProductHit = {
  id: string;
  name: string;
  sku: string | null;
  unitType: string | null;
  price: number;
  currentStock: number;
};

type CartLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type ClientOpt = { id: string; name: string };

type Detail = {
  sale: SaleRow & { notes: string | null; clientId: string | null };
  clientName: string | null;
  items: { id: string; productId: string; nameSnapshot: string; quantity: string; unitPrice: string; lineTotal: string }[];
  payments: { id: string; amount: string; method: string; note: string | null; paidAt: string | null }[];
  total: number;
  paid: number;
  balance: number;
};

const statusLabels: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  draft: { label: "Presupuesto", color: "warning" },
  confirmed: { label: "Venta", color: "success" },
  cancelled: { label: "Anulada", color: "error" },
};

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  other: "Otro",
};

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalesModule() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  // nueva venta
  const [openNew, setOpenNew] = useState(false);
  const [clientOpts, setClientOpts] = useState<ClientOpt[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [prodSearch, setProdSearch] = useState("");
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // detalle
  const [detail, setDetail] = useState<Detail | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");

  function notify(msg: string, sev: "success" | "error") {
    setSnack({ msg, sev });
  }

  const loadSales = useCallback(async () => {
    const status = ["", "confirmed", "draft", "cancelled"][tab];
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/sales?${params}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.sales);
    }
  }, [tab]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    if (!openNew) return;
    fetch("/api/clients")
      .then((r) => (r.ok ? r.json() : { clients: [] }))
      .then((d) => setClientOpts(d.clients?.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })) ?? []))
      .catch(() => {});
  }, [openNew]);

  useEffect(() => {
    if (!openNew || prodSearch.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/sales/products-search?search=${encodeURIComponent(prodSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setHits(data.products);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [prodSearch, openNew]);

  const cartTotal = useMemo(
    () => cart.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0),
    [cart]
  );

  function addProduct(p: ProductHit) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, quantity: 1, unitPrice: p.price },
      ];
    });
  }

  function updateLine(productId: string, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  }

  function resetNew() {
    setOpenNew(false);
    setClientId("");
    setProdSearch("");
    setHits([]);
    setCart([]);
    setNotes("");
  }

  async function saveSale(confirm: boolean) {
    if (cart.length === 0) {
      notify("Agregá al menos un producto", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        clientId: clientId || null,
        items: cart.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        notes: notes || null,
      };
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "Error al guardar", "error");
        return;
      }
      if (confirm) {
        const cres = await fetch(`/api/sales/${data.sale.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm" }),
        });
        const cdata = await cres.json().catch(() => ({}));
        if (!cres.ok) {
          notify(cdata.error ?? "Guardado como presupuesto (falló la confirmación)", "error");
          resetNew();
          loadSales();
          return;
        }
        notify("Venta confirmada", "success");
      } else {
        notify("Presupuesto guardado", "success");
      }
      resetNew();
      loadSales();
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(id: string) {
    const res = await fetch(`/api/sales/${id}`);
    if (!res.ok) {
      notify("Error al cargar la venta", "error");
      return;
    }
    setPayAmount("");
    setPayNote("");
    setDetail(await res.json());
  }

  async function detailAction(action: "confirm" | "cancel") {
    if (!detail) return;
    const res = await fetch(`/api/sales/${detail.sale.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notify(data.error ?? "Error", "error");
      return;
    }
    notify(action === "confirm" ? "Venta confirmada" : "Venta anulada", "success");
    setDetail(null);
    loadSales();
  }

  async function addPayment() {
    if (!detail) return;
    const amount = Number(payAmount.replace(",", "."));
    if (!(amount > 0)) {
      notify("Ingresá un monto válido", "error");
      return;
    }
    const res = await fetch(`/api/sales/${detail.sale.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method: payMethod, note: payNote || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notify(data.error ?? "Error al registrar el pago", "error");
      return;
    }
    notify("Pago registrado", "success");
    openDetail(detail.sale.id);
    loadSales();
  }

  async function removePayment(paymentId: string) {
    if (!detail) return;
    const res = await fetch(`/api/sales/${detail.sale.id}/payments/${paymentId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      notify("Error al borrar el pago", "error");
      return;
    }
    openDetail(detail.sale.id);
    loadSales();
  }

  async function editDraft(id: string) {
    const res = await fetch(`/api/sales/${id}`);
    if (!res.ok) return;
    const d: Detail = await res.json();
    setClientId(d.sale.clientId ?? "");
    setNotes(d.sale.notes ?? "");
    setCart(
      d.items.map((i) => ({
        productId: i.productId,
        name: i.nameSnapshot,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      }))
    );
    setOpenNew(true);
    setEditingId(id);
  }

  const [editingId, setEditingId] = useState<string | null>(null);

  async function saveEdited() {
    if (!editingId || cart.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          clientId: clientId || null,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
          notes: notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error ?? "Error al guardar", "error");
        return;
      }
      notify("Presupuesto actualizado", "success");
      setEditingId(null);
      resetNew();
      loadSales();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Ventas</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button component={Link} href="/dashboard/sales/designer">
            Diseño de comprobantes
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => {
              setEditingId(null);
              setCart([]);
              setNotes("");
              setClientId("");
              setOpenNew(true);
            }}
          >
            Nueva venta
          </Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Todas" />
        <Tab label="Ventas" />
        <Tab label="Presupuestos" />
        <Tab label="Anuladas" />
      </Tabs>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Pagado</TableCell>
              <TableCell align="right">Saldo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                    No hay ventas todavía.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.code}</TableCell>
                <TableCell>{s.clientName ?? "Consumidor final"}</TableCell>
                <TableCell>{s.itemCount}</TableCell>
                <TableCell align="right">${fmt(s.total)}</TableCell>
                <TableCell align="right">${fmt(s.paid)}</TableCell>
                <TableCell align="right">
                  {s.status === "confirmed" && s.balance > 0 ? (
                    <Typography color="warning.main" component="span">${fmt(s.balance)}</Typography>
                  ) : (
                    `$${fmt(s.status === "confirmed" ? s.balance : 0)}`
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={statusLabels[s.status]?.label ?? s.status}
                    color={statusLabels[s.status]?.color}
                    variant={s.status === "confirmed" && s.balance > 0 ? "outlined" : "filled"}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => openDetail(s.id)}>
                      Ver
                    </Button>
                    {s.status === "draft" && (
                      <Button size="small" onClick={() => editDraft(s.id)}>
                        Editar
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Diálogo nueva venta / editar presupuesto */}
      <Dialog open={openNew} onClose={resetNew} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? "Editar presupuesto" : "Nueva venta"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Cliente</InputLabel>
              <Select label="Cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <MenuItem value="">Consumidor final</MenuItem>
                {clientOpts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Notas"
              size="small"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>

          {!editingId && (
            <Box>
              <TextField
                label="Buscar producto por nombre, SKU o código de barras"
                size="small"
                fullWidth
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
              />
              {hits.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 1, maxHeight: 220, overflow: "auto" }}>
                  {hits.map((p) => (
                    <ProductHitRow key={p.id} hit={p} onAdd={() => addProduct(p)} />
                  ))}
                </Paper>
              )}
            </Box>
          )}

          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>Cantidad</TableCell>
                  <TableCell align="right" sx={{ width: 140 }}>Precio</TableCell>
                  <TableCell align="right" sx={{ width: 130 }}>Subtotal</TableCell>
                  <TableCell sx={{ width: 60 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cart.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary" align="center" sx={{ py: 1.5 }}>
                        Buscá y agregá productos arriba.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {cart.map((l) => (
                  <TableRow key={l.productId}>
                    <TableCell>{l.name}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={l.quantity}
                        onChange={(e) => updateLine(l.productId, { quantity: Number(e.target.value) })}
                        slotProps={{ htmlInput: { min: 0.001, step: "any", style: { textAlign: "right" } } }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={l.unitPrice}
                        onChange={(e) => updateLine(l.productId, { unitPrice: Number(e.target.value) })}
                        slotProps={{ htmlInput: { min: 0, step: "any", style: { textAlign: "right" } } }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell align="right">${fmt(l.quantity * l.unitPrice)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        aria-label="Quitar"
                        onClick={() => setCart((prev) => prev.filter((x) => x.productId !== l.productId))}
                      >
                        ✕
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Typography variant="h6">Total: ${fmt(cartTotal)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetNew}>Cancelar</Button>
          {editingId ? (
            <Button variant="contained" disabled={saving} disableElevation onClick={saveEdited}>
              Guardar cambios
            </Button>
          ) : (
            <>
              <Button variant="outlined" disabled={saving} onClick={() => saveSale(false)}>
                Guardar presupuesto
              </Button>
              <Button variant="contained" disabled={saving} disableElevation onClick={() => saveSale(true)}>
                Confirmar venta
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo detalle */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        {detail && (
          <>
            <DialogTitle>
              {detail.sale.code} ·{" "}
              <Chip
                size="small"
                sx={{ ml: 1, verticalAlign: "middle" }}
                label={statusLabels[detail.sale.status]?.label}
                color={statusLabels[detail.sale.status]?.color}
              />
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography color="text.secondary">
                Cliente: {detail.clientName ?? "Consumidor final"} ·{" "}
                {detail.sale.createdAt
                  ? new Date(detail.sale.createdAt).toLocaleDateString("es-AR")
                  : ""}
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.nameSnapshot}</TableCell>
                      <TableCell align="right">{Number(i.quantity)}</TableCell>
                      <TableCell align="right">${fmt(Number(i.unitPrice))}</TableCell>
                      <TableCell align="right">${fmt(Number(i.lineTotal))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                  <Typography sx={{ textAlign: "right" }}>Total: ${fmt(detail.total)}</Typography>
                  <Typography sx={{ textAlign: "right" }} color="text.secondary">
                    Pagado: ${fmt(detail.paid)}
                  </Typography>
                  <Divider />
                  <Typography sx={{ textAlign: "right", fontWeight: "bold" }}>
                    Saldo: ${fmt(detail.balance)}
                  </Typography>
                </Stack>
              </Box>

              {detail.payments.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Pagos</Typography>
                  <Stack spacing={1}>
                    {detail.payments.map((p) => (
                      <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip size="small" label={methodLabels[p.method] ?? p.method} />
                        <Typography>${fmt(Number(p.amount))}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {p.note}
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <IconButton size="small" aria-label="Borrar pago" onClick={() => removePayment(p.id)}>
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {detail.sale.status === "confirmed" && detail.balance > 0 && (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <TextField
                    label="Monto"
                    size="small"
                    sx={{ width: 120 }}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <FormControl size="small" sx={{ width: 160 }}>
                    <InputLabel>Método</InputLabel>
                    <Select label="Método" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      {Object.entries(methodLabels).map(([k, v]) => (
                        <MenuItem key={k} value={k}>{v}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" disableElevation onClick={addPayment}>
                    Registrar pago
                  </Button>
                </Box>
              )}

              {detail.sale.notes && (
                <Typography variant="body2" color="text.secondary">Notas: {detail.sale.notes}</Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
              <Button
                onClick={() =>
                  window.open(`/print/sale/${detail.sale.id}?format=a4&auto=1`, "_blank")
                }
              >
                🖨️ A4
              </Button>
              <Button
                onClick={() =>
                  window.open(`/print/sale/${detail.sale.id}?format=thermal80&auto=1`, "_blank")
                }
              >
                🧾 Térmica 80mm
              </Button>
              <Box sx={{ flex: 1 }} />
              {detail.sale.status === "draft" && (
                <Button variant="contained" disableElevation onClick={() => detailAction("confirm")}>
                  Confirmar venta
                </Button>
              )}
              {detail.sale.status !== "cancelled" && (
                <Button color="error" onClick={() => detailAction("cancel")}>
                  Anular
                </Button>
              )}
              <Button onClick={() => setDetail(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
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

function ProductHitRow({ hit, onAdd }: { hit: ProductHit; onAdd: () => void }) {
  return (
    <Box
      onClick={onAdd}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        px: 2,
        py: 1,
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box>
        <Typography variant="body2">{hit.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          Stock: {hit.currentStock} {hit.sku ? `· SKU: ${hit.sku}` : ""}
        </Typography>
      </Box>
      <Typography variant="body2">${fmt(hit.price)}</Typography>
    </Box>
  );
}

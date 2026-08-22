"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SettingsIcon from "@mui/icons-material/Settings";
import type { PrintFormat, PrintTemplateElement } from "@apolo/database";
import PrintDocument from "../../../print/sale/[id]/PrintDocument";
import type { SaleDetailData } from "../../../print/sale/[id]/types";

const BLOCK_LABELS: Record<string, string> = {
  logo: "Logo de la empresa",
  title: "Título del comprobante",
  company: "Datos de la empresa",
  client: "Datos del cliente",
  meta: "Fecha y vendedor",
  items: "Tabla de productos",
  totals: "Totales",
  payments: "Pagos recibidos",
  notes: "Notas de la venta",
  freetext: "Texto libre",
  footer: "Pie / firma",
};

const DEMO_SALE: SaleDetailData = {
  code: "V-0042",
  status: "confirmed",
  clientName: "Almacén Don Luis",
  clientTaxId: "30-61234567-9",
  clientAddress: "Av. Siempreviva 742",
  clientPhone: "011 4333-2211",
  sellerName: "Gabriel",
  createdAt: new Date().toISOString(),
  notes: "Pasa a buscar los jueves por la tarde.",
  total: 2475.2,
  paid: 2475.2,
  balance: 0,
  items: [
    { id: "1", nameSnapshot: "Papa blanca", productSku: "PAP-0001", quantity: "10", unitPrice: "618.80", lineTotal: "6188.00" },
    { id: "2", nameSnapshot: "Batata colorada", productSku: null, quantity: "2.5", unitPrice: "900.00", lineTotal: "2250.00" },
    { id: "3", nameSnapshot: "Cebolla", productSku: "CEB-0001", quantity: "4", unitPrice: "750.50", lineTotal: "3002.00" },
  ],
  payments: [
    { id: "p1", amount: "1475.20", methodLabel: "Efectivo", note: null },
    { id: "p2", amount: "1000.00", methodLabel: "Transferencia", note: "seña" },
  ],
};

type CompanyForm = {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
};

function SortableBlock({
  element,
  index,
  onToggle,
  onPropChange,
}: {
  element: PrintTemplateElement;
  index: number;
  onToggle: (enabled: boolean) => void;
  onPropChange: (patch: NonNullable<PrintTemplateElement["props"]>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${element.type}-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const hasText = ["title", "freetext", "footer"].includes(element.type);
  const hasAlign = !["items", "totals"].includes(element.type);
  const hasColumns = element.type === "items";

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        mb: 1,
        p: 1,
        opacity: element.enabled ? 1 : 0.55,
        bgcolor: element.enabled ? "background.paper" : "action.hover",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          {...attributes}
          {...listeners}
          sx={{ cursor: "grab", display: "flex", alignItems: "center", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
        <Typography variant="body2" sx={{ flex: 1 }}>
          {BLOCK_LABELS[element.type]}
        </Typography>
        <Switch size="small" checked={element.enabled} onChange={(e) => onToggle(e.target.checked)} />
      </Box>

      {(hasText || hasColumns || element.type === "totals" || hasAlign) && (
        <Collapse in={element.enabled}>
          <Box sx={{ pl: 4, pr: 1, pb: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            {hasText && (
              <TextField
                label="Texto"
                size="small"
                fullWidth
                value={element.props?.text ?? ""}
                onChange={(e) => onPropChange({ text: e.target.value })}
              />
            )}
            {hasColumns && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {(
                  [
                    ["sku", "SKU"],
                    ["quantity", "Cantidad"],
                    ["unitPrice", "Precio"],
                    ["lineTotal", "Subtotal"],
                  ] as const
                ).map(([key, label]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        size="small"
                        checked={element.props?.columns?.[key] ?? false}
                        onChange={(e) =>
                          onPropChange({
                            columns: { ...element.props?.columns, [key]: e.target.checked },
                          })
                        }
                      />
                    }
                    label={<Typography variant="caption">{label}</Typography>}
                  />
                ))}
              </Box>
            )}
            {element.type === "totals" && (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={element.props?.showPaid ?? true}
                      onChange={(e) => onPropChange({ showPaid: e.target.checked })}
                    />
                  }
                  label={<Typography variant="caption">Mostrar monto pagado</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={element.props?.showBalance ?? true}
                      onChange={(e) => onPropChange({ showBalance: e.target.checked })}
                    />
                  }
                  label={<Typography variant="caption">Mostrar saldo pendiente</Typography>}
                />
              </>
            )}
            {hasAlign && (
              <FormControl size="small" fullWidth>
                <InputLabel>Alineación</InputLabel>
                <Select
                  label="Alineación"
                  value={element.props?.align ?? "left"}
                  onChange={(e) => onPropChange({ align: e.target.value as "left" | "center" | "right" })}
                >
                  <MenuItem value="left">Izquierda</MenuItem>
                  <MenuItem value="center">Centro</MenuItem>
                  <MenuItem value="right">Derecha</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </Collapse>
      )}
    </Paper>
  );
}

export default function DesignerClient() {
  const [format, setFormat] = useState<PrintFormat>("a4");
  const [elements, setElements] = useState<PrintTemplateElement[]>([]);
  const [company, setCompany] = useState<CompanyForm>({
    name: "",
    taxId: "",
    address: "",
    phone: "",
    email: "",
    logoUrl: null,
  });
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function notify(msg: string, sev: "success" | "error") {
    setSnack({ msg, sev });
  }

  const loadFormat = useCallback(async (fmt: PrintFormat) => {
    const res = await fetch(`/api/print-templates?format=${fmt}`);
    if (res.ok) {
      const data = await res.json();
      setElements(data.elements);
    }
  }, []);

  useEffect(() => {
    loadFormat(format);
  }, [format, loadFormat]);

  useEffect(() => {
    fetch("/api/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) =>
        d?.company &&
        setCompany({
          name: d.company.name ?? "",
          taxId: d.company.taxId ?? "",
          address: d.company.address ?? "",
          phone: d.company.phone ?? "",
          email: d.company.email ?? "",
          logoUrl: d.company.logoUrl ?? null,
        })
      )
      .catch(() => {});
  }, []);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setElements((prev) => {
      const from = prev.findIndex((el, i) => `${el.type}-${i}` === active.id);
      const to = prev.findIndex((el, i) => `${el.type}-${i}` === over!.id);
      if (from < 0 || to < 0) return prev;
      return arrayMove(prev, from, to);
    });
  }

  function toggleAt(idx: number, enabled: boolean) {
    setElements((prev) => prev.map((el, i) => (i === idx ? { ...el, enabled } : el)));
  }

  function propAt(idx: number, patch: NonNullable<PrintTemplateElement["props"]>) {
    setElements((prev) =>
      prev.map((el, i) => (i === idx ? { ...el, props: { ...el.props, ...patch } } : el))
    );
  }

  async function saveCompany() {
    const res = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: company.name || undefined,
        taxId: company.taxId || null,
        address: company.address || null,
        phone: company.phone || null,
        email: company.email || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notify(data.error ?? "Error al guardar datos de la empresa", "error");
      return;
    }
    notify("Datos de la empresa guardados", "success");
  }

  async function uploadLogo(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/company/logo", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notify(data.error ?? "Error al subir el logo", "error");
      return;
    }
    setCompany((c) => ({ ...c, logoUrl: data.logoUrl }));
    notify("Logo actualizado", "success");
  }

  async function saveTemplate() {
    setSaving(true);
    try {
      const res = await fetch("/api/print-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, elements }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error ?? "Error al guardar el diseño", "error");
        return;
      }
      notify(`Diseño ${format === "a4" ? "A4" : "térmica"} guardado`, "success");
    } finally {
      setSaving(false);
    }
  }

  async function resetTemplate() {
    const res = await fetch(`/api/print-templates?format=${format}`, { method: "DELETE" });
    if (!res.ok) {
      notify("Error al restablecer", "error");
      return;
    }
    loadFormat(format);
    notify("Diseño restablecido al estándar", "success");
  }

  const previewScale = format === "thermal80" ? 1.15 : 0.85;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5">Diseño de comprobantes</Typography>
        <ToggleButtonGroup
          size="small"
          value={format}
          exclusive
          onChange={(_, v) => v && setFormat(v)}
        >
          <ToggleButton value="a4">Hoja A4</ToggleButton>
          <ToggleButton value="thermal80">Térmica 80mm</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Datos de la empresa */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Datos de la empresa (salen en el comprobante)</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1.5, flex: 1, minWidth: 320 }}>
            <TextField label="Nombre" size="small" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            <TextField label="CUIT / Razón social" size="small" value={company.taxId} onChange={(e) => setCompany({ ...company, taxId: e.target.value })} />
            <TextField label="Dirección" size="small" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            <TextField label="Teléfono" size="small" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
            <TextField label="Email" size="small" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
            <Button onClick={saveCompany}>Guardar datos</Button>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 120, height: 70, border: "1px dashed #bbb", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <Typography variant="caption" color="text.secondary">Sin logo</Typography>
              )}
            </Box>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadLogo(f);
                e.target.value = "";
              }}
            />
            <Button size="small" variant="outlined" onClick={() => fileRef.current?.click()}>
              Subir logo
            </Button>
            <Typography variant="caption" color="text.secondary">PNG o JPG · máx 500KB</Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" }, alignItems: "flex-start" }}>
        {/* Editor de bloques */}
        <Box sx={{ flex: 1, width: "100%", minWidth: 0 }}>
          <Typography variant="subtitle1" gutterBottom>
            Bloques — arrastrá para ordenar, activá y configurá
          </Typography>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={elements.map((el, i) => `${el.type}-${i}`)} strategy={verticalListSortingStrategy}>
              {elements.map((el, i) => (
                <SortableBlock
                  key={`${el.type}-${i}`}
                  element={el}
                  index={i}
                  onToggle={(v) => toggleAt(i, v)}
                  onPropChange={(patch) => propAt(i, patch)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button variant="contained" disableElevation disabled={saving} onClick={saveTemplate}>
              Guardar diseño {format === "a4" ? "A4" : "térmica"}
            </Button>
            <Button onClick={resetTemplate}>Restablecer estándar</Button>
          </Box>
        </Box>

        {/* Vista previa */}
        <Box sx={{ width: { xs: "100%", md: 420 }, position: "sticky", top: 24 }}>
          <Typography variant="subtitle1" gutterBottom>Vista previa (datos de ejemplo)</Typography>
          <Paper variant="outlined" sx={{ p: 2, overflow: "auto", maxHeight: "75vh", display: "flex", justifyContent: "center", bgcolor: "#e8e8e8" }}>
            <Box sx={{ transform: `scale(${previewScale})`, transformOrigin: "top center" }}>
              <PrintDocument format={format} elements={elements} sale={DEMO_SALE} company={company} />
            </Box>
          </Paper>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            El diseño se guarda por separado para A4 y para térmica.
          </Typography>
        </Box>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        {snack ? (
          <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

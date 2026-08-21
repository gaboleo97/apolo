"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function AccountForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  function notify(msg: string, sev: "success" | "error") {
    setSnack({ msg, sev });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirm) {
      notify("Las contraseñas no coinciden", "error");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (res.ok) {
      notify("Contraseña actualizada correctamente", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.error ?? "No se pudo cambiar la contraseña", "error");
    }
    setLoading(false);
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Mi cuenta
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Cambiá tu contraseña de acceso.
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 480 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Cambiar contraseña
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            label="Contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="current-password"
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="new-password"
            helperText="Mínimo 6 caracteres"
          />
          <TextField
            label="Repetir nueva contraseña"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="new-password"
          />
          <Box>
            <Button type="submit" variant="contained" disableElevation disabled={loading}>
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </Box>
        </Box>
      </Paper>

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

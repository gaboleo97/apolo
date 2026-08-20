"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      router.push("/login?reset=1");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo restablecer la contraseña");
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background: "linear-gradient(135deg, #0a1628 0%, #000000 50%, #0a1628 100%)",
      }}
    >
      <Paper sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48, fontSize: 20, fontWeight: 700, mx: "auto", mb: 2 }}>
            A
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Nueva contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Elegí una contraseña nueva para tu cuenta
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="new-password"
          />
          <TextField
            label="Repetir contraseña"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="new-password"
          />
          <Button type="submit" variant="contained" fullWidth disableElevation sx={{ py: 1.2 }} disabled={loading}>
            {loading ? "Guardando..." : "Restablecer contraseña"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}

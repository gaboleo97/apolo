"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      setError("No se pudo procesar la solicitud. Intentá de nuevo.");
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
            Recuperar contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Te enviaremos un enlace para restablecerla
          </Typography>
        </Box>

        {sent ? (
          <Alert severity="success">
            Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size="small"
              autoComplete="email"
              placeholder="tu@email.com"
            />
            <Button type="submit" variant="contained" fullWidth disableElevation sx={{ py: 1.2 }} disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          <Typography component="a" href="/login" variant="body2" color="primary" sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Volver a iniciar sesión
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}

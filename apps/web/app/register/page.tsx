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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [slug, setSlug] = useState("");
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const isInvite = Boolean(invite);

  async function lookupSlug(value: string) {
    const v = value.trim();
    setTenantName(null);
    setSlugError(null);
    if (!v) return;
    const res = await fetch(`/api/tenants/lookup?slug=${encodeURIComponent(v)}`);
    if (res.ok) {
      const data = await res.json();
      setTenantName(data.name);
    } else {
      setSlugError("Empresa no encontrada");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const res = await fetch(isInvite ? "/api/register/join" : "/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isInvite ? { ...payload, token: invite } : { ...payload, slug: form.get("slug") }),
    });

    if (res.ok) {
      router.push("/login?registered=1");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear la cuenta. Intentá de nuevo.");
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
            {isInvite ? "Unirte a una empresa" : "Crear cuenta"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isInvite
              ? "Te invitaron a formar parte de una empresa en Apolo"
              : "Ingresá el código de tu empresa para unirte"}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {!isInvite && (
            <TextField
              label="Código de empresa"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onBlur={(e) => lookupSlug(e.target.value)}
              required
              fullWidth
              size="small"
              placeholder="ej. fuzion"
              error={Boolean(slugError)}
              helperText={slugError ?? (tenantName ? `Empresa: ${tenantName}` : undefined)}
            />
          )}
          <TextField label="Nombre" name="name" type="text" required fullWidth size="small" placeholder="Tu nombre" />
          <TextField label="Email" name="email" type="email" required fullWidth size="small" placeholder="tu@email.com" />
          <TextField label="Contraseña" name="password" type="password" required fullWidth size="small" placeholder="••••••••" />
          <Button type="submit" variant="contained" fullWidth disableElevation sx={{ py: 1.2 }} disabled={loading}>
            {loading ? "Creando cuenta..." : isInvite ? "Unirme a la empresa" : "Crear cuenta"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          ¿Ya tenés cuenta?{" "}
          <Typography component="a" href="/login" variant="body2" color="primary" sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Iniciar sesión
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

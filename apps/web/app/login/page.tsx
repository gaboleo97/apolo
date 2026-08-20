"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const reset = searchParams.get("reset");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      redirect: false,
      email: form.get("email") as string,
      password: form.get("password") as string,
    });

    if (res?.ok && !res.error) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Email o contraseña incorrectos");
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
            Iniciar sesión
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Ingresá a tu cuenta de Apolo
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {registered && <Alert severity="success">Cuenta creada. Ya podés iniciar sesión.</Alert>}
          {reset && <Alert severity="success">Contraseña actualizada. Ya podés iniciar sesión.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField name="email" label="Email" type="email" required fullWidth size="small" autoComplete="email" placeholder="tu@email.com" />
          <TextField name="password" label="Contraseña" type="password" required fullWidth size="small" autoComplete="current-password" placeholder="••••••••" />
          <Button type="submit" variant="contained" fullWidth disableElevation sx={{ py: 1.2 }} disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
          <Typography component="a" href="/forgot-password" variant="body2" color="primary" sx={{ textAlign: "right", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            ¿Olvidaste tu contraseña?
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          ¿No tenés cuenta?{" "}
          <Typography component="a" href="/register" variant="body2" color="primary" sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Registrate
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
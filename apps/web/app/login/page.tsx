import Link from "next/link";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function LoginPage() {
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

        <Box component="form" action="/api/auth/callback/credentials" method="POST" sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            id="email"
            name="email"
            label="Email"
            type="email"
            required
            fullWidth
            size="small"
            autoComplete="email"
            placeholder="tu@email.com"
          />
          <TextField
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            required
            fullWidth
            size="small"
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <Button type="submit" variant="contained" fullWidth disableElevation sx={{ py: 1.2 }}>
            Iniciar sesión
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          ¿No tenés cuenta?{" "}
          <Typography component={Link} href="/register" variant="body2" color="primary" sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Registrate
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}

import Link from "next/link";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function RegisterPage() {
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
            Crear cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Comenzá con tu prueba gratuita
          </Typography>
        </Box>

        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            label="Nombre"
            name="name"
            type="text"
            required
            fullWidth
            size="small"
            placeholder="Tu nombre"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            fullWidth
            size="small"
            placeholder="tu@email.com"
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            required
            fullWidth
            size="small"
            placeholder="••••••••"
          />
          <Button type="submit" variant="contained" fullWidth disableElevation sx={{ py: 1.2 }}>
            Crear cuenta gratis
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          ¿Ya tenés cuenta?{" "}
          <Typography component={Link} href="/login" variant="body2" color="primary" sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Iniciar sesión
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}

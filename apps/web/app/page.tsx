import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";

const modules = [
  {
    icon: "📦",
    title: "Inventario",
    desc: "Control de stock, productos y categorías con alertas inteligentes",
  },
  {
    icon: "🛒",
    title: "Ventas",
    desc: "Punto de venta, facturación electrónica y gestión de clientes",
  },
  {
    icon: "📋",
    title: "Compras",
    desc: "Órdenes de compra, proveedores y pagos automatizados",
  },
  {
    icon: "📊",
    title: "Contabilidad",
    desc: "Libros IVA, asientos contables y reportes financieros",
  },
  {
    icon: "🤖",
    title: "AI Analytics",
    desc: "Predicciones de demanda y detección de anomalías",
  },
  {
    icon: "🌎",
    title: "Multi-país",
    desc: "ARCA, SAT, DIAN y más integraciones fiscales",
  },
];

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="fixed">
        <Toolbar>
          <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, mr: 1, fontSize: 14, fontWeight: 700 }}>
            A
          </Avatar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Apolo
          </Typography>
          <Button component={Link} href="/login" sx={{ color: "text.secondary", mr: 1 }}>
            Iniciar sesión
          </Button>
          <Button component={Link} href="/register" variant="contained" disableElevation>
            Comenzar gratis
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          pt: 8,
          background: "linear-gradient(135deg, #0a1628 0%, #000000 50%, #0a1628 100%)",
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <Chip
            label="Plataforma modular para empresas"
            size="small"
            sx={{
              mb: 3,
              borderColor: "primary.main",
              color: "primary.light",
              bgcolor: "rgba(37, 99, 235, 0.08)",
              fontWeight: 500,
            }}
            variant="outlined"
          />
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: "2rem", sm: "3rem", md: "3.75rem" } }}>
            Gestiona tu empresa con
            <Typography
              component="span"
              variant="inherit"
              sx={{
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                ml: 1,
              }}
            >
              módulos inteligentes
            </Typography>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 3, maxWidth: 600, mx: "auto", fontSize: "1.125rem" }}>
            Inventario, ventas, compras, contabilidad y facturación electrónica.
            Activá solo los módulos que necesites y escala cuando quieras.
          </Typography>
          <Box sx={{ mt: 5, display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button component={Link} href="/register" variant="contained" size="large" disableElevation>
              Comenzar gratis
            </Button>
            <Button component={Link} href="#modulos" variant="outlined" size="large">
              Ver módulos
            </Button>
          </Box>
        </Container>
      </Box>

      <Box id="modulos" sx={{ py: 12, px: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography variant="h3" gutterBottom>
              Módulos para cada área
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Activá solo lo que necesitás. Pagá solo por lo que usás.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {modules.map((mod) => (
              <Grid key={mod.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    p: 2,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "rgba(37, 99, 235, 0.03)",
                      boxShadow: "0 0 30px rgba(37, 99, 235, 0.08)",
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      {mod.icon}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {mod.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mod.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          py: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2026 Apolo. Todos los derechos reservados.
        </Typography>
      </Box>
    </Box>
  );
}

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import LogoutIcon from "@mui/icons-material/Logout";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  tenant_admin: "Admin de la empresa",
  manager: "Encargado",
  seller: "Vendedor",
  viewer: "Solo lectura",
};

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (status === "authenticated" && session?.user) {
    const user = session.user;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: "primary.main" }}>
          {(user.name ?? user.email).slice(0, 2).toUpperCase()}
        </Avatar>
        <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right", mr: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {user.name ?? user.email}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {roleLabels[user.role] ?? user.role}
          </Typography>
        </Box>
        <Button component={Link} href="/dashboard" variant="contained" disableElevation size="small">
          Ir al dashboard
        </Button>
        <Tooltip title="Cerrar sesión">
          <IconButton color="inherit" onClick={() => signOut({ callbackUrl: "/" })} size="small">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Button component={Link} href="/login" sx={{ color: "text.secondary", mr: 1 }}>
        Iniciar sesión
      </Button>
      <Button component={Link} href="/register" variant="contained" disableElevation>
        Comenzar gratis
      </Button>
    </Box>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import InputBase from "@mui/material/InputBase";
import Divider from "@mui/material/Divider";
import InventoryIcon from "@mui/icons-material/Inventory";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BusinessIcon from "@mui/icons-material/Business";
import GroupsIcon from "@mui/icons-material/Groups";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import type { ModuleKey } from "@apolo/core";

const drawerWidth = 240;

const moduleMenu: { key: ModuleKey; label: string; href: string; icon: React.ReactNode }[] = [
  { key: "inventory", label: "Inventario", href: "/dashboard/inventory", icon: <InventoryIcon /> },
  { key: "sales", label: "Ventas", href: "/dashboard/sales", icon: <PointOfSaleIcon /> },
  { key: "purchases", label: "Compras", href: "/dashboard/purchases", icon: <ReceiptIcon /> },
  { key: "suppliers", label: "Proveedores", href: "/dashboard/suppliers", icon: <BusinessIcon /> },
  { key: "clients", label: "Clientes", href: "/dashboard/clients", icon: <GroupsIcon /> },
  { key: "accounting", label: "Contabilidad", href: "/dashboard/accounting", icon: <AccountBalanceIcon /> },
  { key: "ai", label: "AI Analytics", href: "/dashboard/ai", icon: <AnalyticsIcon /> },
];

export default function DashboardShell({
  modules,
  role,
  userName,
  children,
}: {
  modules: string[];
  role: string;
  userName?: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTenantAdmin = role === "tenant_admin";
  const isSuperAdmin = role === "super_admin";
  const visibleModules = moduleMenu.filter((item) => modules.includes(item.key));

  const drawer = (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 2 }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: 14, fontWeight: 700 }}>
          A
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Apolo
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/dashboard">
            <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" slotProps={{ primary: { sx: { fontSize: 14 } } }} />
          </ListItemButton>
        </ListItem>
        {visibleModules.map((item) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton component={Link} href={item.href}>
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
            </ListItemButton>
          </ListItem>
        ))}
        {isTenantAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={Link} href="/dashboard/team">
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                <ManageAccountsIcon />
              </ListItemIcon>
              <ListItemText primary="Equipo" slotProps={{ primary: { sx: { fontSize: 14 } } }} />
            </ListItemButton>
          </ListItem>
        )}
        {isSuperAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={Link} href="/dashboard/admin">
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Administración" slotProps={{ primary: { sx: { fontSize: 14 } } }} />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="form"
            sx={{
              flexGrow: 1,
              maxWidth: 400,
              bgcolor: "background.default",
              borderRadius: 1,
              px: 2,
              py: 0.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <InputBase placeholder="Buscar..." fullWidth sx={{ fontSize: 14, color: "text.primary" }} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto" }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "primary.main" }}>
              {userName?.slice(0, 2).toUpperCase() ?? "A"}
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              {userName ?? "Usuario"}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        {children}
      </Box>
    </Box>
  );
}

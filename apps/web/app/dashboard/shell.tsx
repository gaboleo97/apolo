"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
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
import Tooltip from "@mui/material/Tooltip";
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
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HomeIcon from "@mui/icons-material/Home";
import type { ModuleKey } from "@apolo/core";

const drawerWidth = 240;
const miniWidth = 64;

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
  const [collapsed, setCollapsed] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);
  const isTenantAdmin = role === "tenant_admin";
  const isSuperAdmin = role === "super_admin";
  const visibleModules = moduleMenu.filter((item) => modules.includes(item.key));

  function renderItem(label: string, href: string, icon: React.ReactNode) {
    return (
      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={href}
          sx={{
            minHeight: 48,
            justifyContent: collapsed ? "center" : "flex-start",
            px: collapsed ? 1.5 : 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              color: "text.secondary",
              justifyContent: "center",
            }}
          >
            {icon}
          </ListItemIcon>
          {!collapsed && (
            <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
          )}
        </ListItemButton>
      </ListItem>
    );
  }

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 1,
          px: collapsed ? 0 : 2,
          py: 2,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: 14, fontWeight: 700 }}>
            A
          </Avatar>
          {!collapsed && (
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Apolo
            </Typography>
          )}
        </Link>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {renderItem("Dashboard", "/dashboard", <DashboardIcon />)}
        {visibleModules.map((item) => renderItem(item.label, item.href, item.icon))}
        {isTenantAdmin && renderItem("Equipo", "/dashboard/team", <ManageAccountsIcon />)}
        {isSuperAdmin && renderItem("Administración", "/dashboard/admin", <SettingsIcon />)}
      </List>
      <Divider />
      <List>
        {renderItem("Volver al inicio", "/", <HomeIcon />)}
        {renderItem("Mi cuenta", "/dashboard/account", <AccountCircleIcon />)}
        <ListItem disablePadding>
          <Tooltip title="Cerrar sesión" placement="right">
            <ListItemButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              sx={{
                minHeight: 48,
                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 1.5 : 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 2,
                  color: "text.secondary",
                  justifyContent: "center",
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText primary="Cerrar sesión" slotProps={{ primary: { sx: { fontSize: 14 } } }} />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${collapsed ? miniWidth : drawerWidth}px)` },
          ml: { md: `${collapsed ? miniWidth : drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setCollapsed(!collapsed)}
            sx={{ mr: 2, display: { xs: "none", md: "inline-flex" } }}
          >
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
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
            <Tooltip title="Cerrar sesión">
              <IconButton color="inherit" onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: collapsed ? miniWidth : drawerWidth,
          flexShrink: 0,
          transition: "width 0.2s",
          "& .MuiDrawer-paper": {
            width: collapsed ? miniWidth : drawerWidth,
            overflowX: "hidden",
            transition: "width 0.2s",
            boxSizing: "border-box",
          },
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

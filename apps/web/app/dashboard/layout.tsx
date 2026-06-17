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
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuIcon from "@mui/icons-material/Menu";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";

const drawerWidth = 240;

const menuItems = [
  { icon: <DashboardIcon />, label: "Dashboard", href: "/dashboard" },
  { icon: <InventoryIcon />, label: "Inventario", href: "/dashboard/inventory" },
  { icon: <PointOfSaleIcon />, label: "Ventas", href: "/dashboard/sales" },
  { icon: <ReceiptIcon />, label: "Compras", href: "/dashboard/purchases" },
  { icon: <PeopleIcon />, label: "Proveedores", href: "/dashboard/suppliers" },
  { icon: <AccountBalanceIcon />, label: "Contabilidad", href: "/dashboard/accounting" },
  { icon: <AnalyticsIcon />, label: "AI Analytics", href: "/dashboard/ai" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        {menuItems.map((item) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton component={Link} href={item.href}>
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
            </ListItemButton>
          </ListItem>
        ))}
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
              SA
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              Super Admin
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

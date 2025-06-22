import { useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Pets as PetsIcon,
  Receipt as ReceiptIcon,
  Apartment as ApartmentIcon,
  Block as BlockIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { useNavigate, Outlet } from "react-router-dom";

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  minWidth: 0, // Allow content to shrink
  overflow: "auto", // Handle overflow gracefully
  maxWidth: "100vw", // Prevent exceeding viewport width
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  // Ensure AppBar doesn't cause horizontal overflow
  minWidth: 0,
  maxWidth: "100vw",
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const menuItems = [
  { text: "Clients", icon: <PeopleIcon />, path: "/clients" },
  { text: "Animals", icon: <PetsIcon />, path: "/animals" },
  { text: "Invoices", icon: <ReceiptIcon />, path: "/invoices" },
  {
    text: "Rescue Organizations",
    icon: <ApartmentIcon />,
    path: "/organizations",
  },
  { text: "Blacklist", icon: <BlockIcon />, path: "/blacklist" },
];

export default function MainLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleClose();
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>
      <StyledAppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AHA Spay/Neuter Clinic
          </Typography>

          {/* User Menu */}
          <IconButton
            onClick={handleMenu}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={anchorEl ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={anchorEl ? "true" : undefined}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
              {user.username?.[0]?.toUpperCase() || "U"}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={!!anchorEl}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user.username}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogoutClick}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>{" "}
      <Main open={open}>
        <DrawerHeader />
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            overflow: "auto",
            maxWidth: "100%",
          }}
        >
          <Outlet />
        </Box>
      </Main>
      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography id="logout-dialog-description">
            Are you sure you want to log out of your account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

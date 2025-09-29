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
  Chip,
  Alert,
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
  ManageAccounts as ManageAccountsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, Outlet } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { PERMISSIONS, getRoleDisplayName } from "../utils/auth";
import UserManagement from "../components/UserManagement";
import PasswordChangeDialog from "../components/PasswordChangeDialog";

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

const baseMenuItems = [
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

// Admin-only menu items
const adminMenuItems = [
  {
    text: "Services",
    icon: <SettingsIcon />,
    path: "/services",
    permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS,
  },
];

export default function MainLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { user, logout, hasPermission, mustChangePassword, refreshProfile } =
    useUser();

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

  const handleUserManagementOpen = () => {
    handleClose();
    setUserManagementOpen(true);
  };

  const handleUserManagementClose = () => {
    setUserManagementOpen(false);
  };

  const handlePasswordChangeSuccess = async () => {
    // Password was changed successfully
    setSuccessMessage("Password changed successfully!");

    // Refresh user profile to update mustChangePassword flag
    await refreshProfile();

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const handlePasswordChangeCancel = () => {
    // User cancelled password change, log them out
    logout();
    navigate("/auth");
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
              {user?.username?.[0]?.toUpperCase() || "U"}
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
                {user?.username || "User"}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.email || ""}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Chip
                label={getRoleDisplayName(user?.role || "user")}
                size="small"
                color={
                  user?.role === "admin"
                    ? "error"
                    : user?.role === "staff"
                    ? "warning"
                    : "default"
                }
              />
            </MenuItem>
            <Divider />
            {hasPermission(PERMISSIONS.MANAGE_USERS) && (
              <MenuItem onClick={handleUserManagementOpen}>
                <ListItemIcon>
                  <ManageAccountsIcon fontSize="small" />
                </ListItemIcon>
                Manage Users
              </MenuItem>
            )}
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
          {baseMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Admin-only menu items */}
          {adminMenuItems.map((item) =>
            hasPermission(item.permission) ? (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => navigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ) : null
          )}
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
          {/* Success Message */}
          {successMessage && (
            <Alert
              severity="success"
              sx={{
                position: "fixed",
                top: 80,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                minWidth: 300,
                maxWidth: 600,
                boxShadow: 3,
              }}
              onClose={() => setSuccessMessage("")}
            >
              {successMessage}
            </Alert>
          )}
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
      {/* User Management Dialog */}
      <UserManagement
        open={userManagementOpen}
        onClose={handleUserManagementClose}
      />
      {/* Password Change Dialog */}
      <PasswordChangeDialog
        open={mustChangePassword}
        onSuccess={handlePasswordChangeSuccess}
        onCancel={handlePasswordChangeCancel}
        username={user?.username || ""}
      />
    </Box>
  );
}

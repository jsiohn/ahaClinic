import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Alert,
} from "@mui/material";
import { useUser } from "../contexts/UserContext";
import { PermissionGuard, RoleGuard } from "../components/PermissionGuard";
import { PERMISSIONS, getRoleDisplayName } from "../utils/auth";

const RoleDemo: React.FC = () => {
  const { user, permissions } = useUser();

  if (!user) {
    return (
      <Alert severity="info">Please log in to see role-based content.</Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Role-Based Access Control Demo
      </Typography>

      <Grid container spacing={3}>
        {/* User Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current User
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {user.username}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Role:</strong>{" "}
                <Chip
                  label={getRoleDisplayName(user.role)}
                  color="primary"
                  size="small"
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Permissions ({permissions.length})
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {permissions.map((permission) => (
                  <Chip
                    key={permission}
                    label={permission.replace(/_/g, " ").toLowerCase()}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Role-specific content */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role-Specific Content
              </Typography>

              <RoleGuard role="admin">
                <Alert severity="success" sx={{ mb: 2 }}>
                  🎉 Admin Only: You can see this because you're an
                  administrator! You have full access to all features including
                  user management and system settings.
                </Alert>
              </RoleGuard>

              <RoleGuard role="staff">
                <Alert severity="info" sx={{ mb: 2 }}>
                  👥 Staff Only: You can manage most clinic operations but have
                  read-only access to organizations and organization animals.
                </Alert>
              </RoleGuard>

              <RoleGuard role="user">
                <Alert severity="warning" sx={{ mb: 2 }}>
                  � User Only: You have read-only access to view clinic
                  information but cannot make changes.
                </Alert>
              </RoleGuard>
            </CardContent>
          </Card>
        </Grid>

        {/* Permission-specific content */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Permission-Specific Content
              </Typography>

              <PermissionGuard permission={PERMISSIONS.DELETE_CLIENTS}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  🗑️ Delete Permission: You can delete clients (dangerous
                  action!)
                </Alert>
              </PermissionGuard>

              <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  👑 User Management: You can manage other users in the system
                </Alert>
              </PermissionGuard>

              <PermissionGuard permission={PERMISSIONS.DELETE_MEDICAL_RECORDS}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  📋 Medical Records: You can delete medical records
                </Alert>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.READ_CLIENTS}
                fallback={
                  <Alert severity="error">
                    ❌ You don't have permission to read client data
                  </Alert>
                }
              >
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ You can read client information
                </Alert>
              </PermissionGuard>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoleDemo;

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import api from "../utils/api";

interface PasswordChangeDialogProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  username: string;
}

export default function PasswordChangeDialog({
  open,
  onSuccess,
  onCancel,
  username,
}: PasswordChangeDialogProps) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      onSuccess();
    } catch (error: any) {
      setError(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      setError(""); // Clear error when user types
    };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Password Change Required
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Hi {username}, you must change your password before continuing.
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Current Password"
              type="password"
              value={formData.currentPassword}
              onChange={handleInputChange("currentPassword")}
              required
              fullWidth
              autoFocus
            />

            <TextField
              label="New Password"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange("newPassword")}
              required
              fullWidth
              helperText="Must be at least 6 characters long"
            />

            <TextField
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              required
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            Cancel & Logout
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              loading ||
              !formData.currentPassword ||
              !formData.newPassword ||
              !formData.confirmPassword
            }
          >
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

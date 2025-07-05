import React from "react";
import { Dialog, DialogContent } from "@mui/material";
import Login from "../../pages/Auth/Login";
import Register from "../../pages/Auth/Register";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  mode: "login" | "register";
  onSwitchMode: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  mode,
  onSwitchMode,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {mode === "login" ? (
          <Login onSuccess={onClose} />
        ) : (
          <Register onSwitchMode={onSwitchMode} onSuccess={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

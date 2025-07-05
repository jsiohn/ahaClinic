import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
} from "@mui/material";
import { useUser } from "../../contexts/UserContext";

interface LoginProps {
  onSwitchMode: () => void;
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchMode, onSuccess }) => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData);
      // Only call onSuccess and navigate if login is successful
      onSuccess();
      navigate("/clients");
    } catch (err: any) {
      // Set error message but don't close modal or navigate away
      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid username or password"
      );
      // Clear the password field but keep the username
      setFormData({
        ...formData,
        password: "",
      });
      // Keep the modal open by not calling onSuccess
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {" "}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Welcome Back
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Sign in to your account
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: "medium" }}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              textTransform: "none",
              fontSize: "1.1rem",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Stack>
      </form>
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{" "}
          <Button
            onClick={onSwitchMode}
            sx={{ textTransform: "none" }}
            color="primary"
          >
            Sign up
          </Button>
        </Typography>
      </Box>
    </motion.div>
  );
};

export default Login;

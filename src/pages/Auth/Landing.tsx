import React from "react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import PetsIcon from "@mui/icons-material/Pets";
import HandshakeIcon from "@mui/icons-material/Handshake";
import SupportIcon from "@mui/icons-material/Support";

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

const Landing: React.FC<LandingProps> = ({ onLogin, onRegister }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(120deg, #e0f7fa 0%, #bbdefb 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, md: 6 },
              borderRadius: 2,
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack spacing={4}>
              {/* Hero Section */}
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography
                  variant="h3"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: "bold",
                    color: theme.palette.primary.main,
                  }}
                >
                  Welcome to AhaClinic
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Modern veterinary practice management system
                </Typography>
              </Box>

              {/* Features */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={4}
                sx={{ mb: 4 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    p: 2,
                  }}
                >
                  <PetsIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.primary.main,
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Pet Care
                  </Typography>
                  <Typography color="text.secondary">
                    Comprehensive pet health management
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    p: 2,
                  }}
                >
                  <SupportIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.primary.main,
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" gutterBottom>
                    24/7 Support
                  </Typography>
                  <Typography color="text.secondary">
                    Round-the-clock veterinary assistance
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    p: 2,
                  }}
                >
                  <HandshakeIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.primary.main,
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Community Focus
                  </Typography>
                  <Typography color="text.secondary">
                    Dedicated to serving our local community
                  </Typography>
                </Box>
              </Stack>

              {/* Action Buttons */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ 
                  mt: 2,
                  justifyContent: "center",
                  width: "100%"
                }}
              >
                <Button
                  onClick={onLogin}
                  variant="contained"
                  size="large"
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1.1rem"
                  }}
                >
                  Sign In
                </Button>
                <Button
                  onClick={onRegister}
                  variant="outlined"
                  size="large"
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1.1rem"
                  }}
                >
                  Create Account
                </Button>
              </Stack>

              {/* Footer */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 4, textAlign: "center" }}
              >
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </Stack>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Landing;

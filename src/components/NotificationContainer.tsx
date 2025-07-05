import { Alert, Box } from "@mui/material";
import { useNotifications } from "../contexts/NotificationContext";

export default function NotificationContainer() {
  const { notifications, hideNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 300,
        maxWidth: 600,
      }}
    >
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          severity={notification.type}
          onClose={() => hideNotification(notification.id)}
          sx={{
            boxShadow: 3,
          }}
        >
          {notification.message}
        </Alert>
      ))}
    </Box>
  );
}

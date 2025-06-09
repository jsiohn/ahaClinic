import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";

interface Version {
  _id?: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
  };
  notes?: string;
}

interface VersionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  documentName: string;
  versions: Version[];
  currentVersion: number;
  onRestoreVersion: (versionNumber: number) => void;
  onViewVersion: (versionNumber: number) => void;
  loading: boolean;
}

const VersionHistoryDialog: React.FC<VersionHistoryDialogProps> = ({
  open,
  onClose,
  documentName,
  versions,
  currentVersion,
  onRestoreVersion,
  onViewVersion,
  loading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">
            <HistoryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Version History
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Document: <strong>{documentName}</strong>
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : versions.length === 0 ? (
          <Box sx={{ my: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No version history available for this document.
            </Typography>
          </Box>
        ) : (
          <List sx={{ mt: 2 }}>
            {/* Current version */}
            <ListItem
              sx={{
                bgcolor: "primary.light",
                color: "primary.contrastText",
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemIcon>
                <DescriptionIcon sx={{ color: "primary.contrastText" }} />
              </ListItemIcon>
              <ListItemText
                primary={`Current Version (${currentVersion})`}
                secondary={
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ color: "primary.contrastText" }}
                  >
                    Last modified: {new Date().toLocaleString()} • Current
                    working copy
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="View Current Version">
                  <IconButton
                    edge="end"
                    onClick={() => onViewVersion(currentVersion)}
                    sx={{ color: "primary.contrastText" }}
                  >
                    <RestoreIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>

            {/* Previous versions */}
            {versions.map((version, index) => {
              const versionNumber = versions.length - index;
              return (
                <ListItem
                  key={`version-${versionNumber}`}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Version ${versionNumber}`}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          Created:{" "}
                          {new Date(version.createdAt).toLocaleString()}
                          {version.createdBy
                            ? ` • By: ${version.createdBy.name}`
                            : ""}
                        </Typography>
                        {version.notes && (
                          <Typography
                            component="p"
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {version.notes}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="View this version">
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={() => onViewVersion(versionNumber)}
                        sx={{ mr: 1 }}
                      >
                        <DescriptionIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Restore to this version">
                      <IconButton
                        edge="end"
                        color="secondary"
                        onClick={() => onRestoreVersion(versionNumber)}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistoryDialog;

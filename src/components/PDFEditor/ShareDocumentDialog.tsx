import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
  CircularProgress,
  Divider,
  IconButton,
  Slider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import api from "../../utils/api";

interface ShareResponse {
  shareLink: string;
  expiresAt?: string;
}

interface ShareDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string | null;
  documentName: string;
}

const ShareDocumentDialog: React.FC<ShareDocumentDialogProps> = ({
  open,
  onClose,
  documentId,
  documentName,
}) => {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState(7);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!documentId) return;

    setLoading(true);
    try {
      const response = await api.post<ShareResponse>(
        `/documents/${documentId}/share`,
        {
          expiryDays,
        }
      );
      if (response?.data?.shareLink) {
        setShareLink(response.data.shareLink);
      }
    } catch (error) {
      console.error("Error sharing document:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareLink(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">
            <ShareIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Share Document
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You are sharing: <strong>{documentName}</strong>
        </Typography>

        {!shareLink ? (
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>Link will expire after:</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Slider
                value={expiryDays}
                onChange={(_, value) => setExpiryDays(value as number)}
                step={1}
                min={1}
                max={30}
                valueLabelDisplay="auto"
                sx={{ maxWidth: 300 }}
              />
              <Typography>
                {expiryDays} {expiryDays === 1 ? "day" : "days"}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              value={shareLink}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={handleCopyLink}
                      startIcon={<CopyIcon />}
                      variant="text"
                      color={copied ? "success" : "primary"}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This link will expire in {expiryDays}{" "}
              {expiryDays === 1 ? "day" : "days"}. Anyone with this link can
              view the document.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        {!shareLink ? (
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <ShareIcon />}
          >
            {loading ? "Generating Link..." : "Create Share Link"}
          </Button>
        ) : (
          <Button variant="contained" color="success" onClick={handleClose}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ShareDocumentDialog;

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Divider,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Client } from "../../types/models";
import BlacklistForm from "./BlacklistForm";
import api from "../../utils/api";

export default function BlacklistPage() {
  const [blacklistedClients, setBlacklistedClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchBlacklistedClients = async () => {
    try {
      setLoading(true);
      // Fetch only blacklisted clients
      const response = await api.get("/clients");

      // Filter by isBlacklisted flag and transform data
      const transformedData = Array.isArray(response)
        ? response
            .filter((client: any) => client.isBlacklisted)
            .map((client: any) => ({
              ...client,
              id: client._id || client.id,
              address: client.address || {
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
              },
              createdAt: new Date(client.createdAt),
              updatedAt: new Date(client.updatedAt),
            }))
        : [];

      setBlacklistedClients(transformedData);
      setError("");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to fetch blacklisted clients";
      setError(message);
      setBlacklistedClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklistedClients();
  }, []);

  const handleCreateClick = () => {
    setSelectedClient(null);
    setOpenDialog(true);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setOpenDialog(true);
  };

  const handleRemoveFromBlacklist = async (client: Client) => {
    try {
      // Update client to remove blacklist status
      await api.put(`/clients/${client.id}`, {
        ...client,
        isBlacklisted: false,
        blacklistReason: "",
      });

      await fetchBlacklistedClients(); // Refresh the list
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to remove client from blacklist"
      );
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };
  const handleRowClick = (params: any) => {
    // Check if the click target is a button or icon
    const isActionButton = (params.event?.target as HTMLElement)?.closest(
      ".MuiIconButton-root"
    );
    if (!isActionButton) {
      setSelectedClient(params.row);
      setOpenDetailDialog(true);
    }
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedClient(null);
  };

  const handleSaveBlacklist = async (clientData: Partial<Client>) => {
    try {
      // Update client with blacklist info
      await api.put(`/clients/${clientData.id}`, {
        ...clientData,
        isBlacklisted: true,
      });

      await fetchBlacklistedClients(); // Refresh the list
      handleCloseDialog();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save blacklist entry"
      );
    }
  };

  const columns: GridColDef[] = [
    {
      field: "fullName",
      headerName: "Client Name",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon fontSize="small" />
          {`${params.row.firstName} ${params.row.lastName}`}
        </Box>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
    },
    {
      field: "blacklistReason",
      headerName: "Reason",
      width: 300,
    },
    {
      field: "updatedAt",
      headerName: "Date Added",
      width: 120,
      type: "date",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                handleEditClick(params.row);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove from Blacklist">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                handleRemoveFromBlacklist(params.row);
              }}
              color="error"
            >
              <BlockIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Blacklist
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage problematic clients and view blacklist history
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          color="error"
        >
          Add to Blacklist
        </Button>
      </Box>
      <DataGrid
        rows={blacklistedClients}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "updatedAt", sort: "desc" }],
          },
        }}
        pageSizeOptions={[10, 20, 50]}
        checkboxSelection={false}
        disableRowSelectionOnClick={false}
        autoHeight
        loading={loading}
        onRowClick={handleRowClick}
        sx={{
          "& .MuiDataGrid-row": {
            cursor: "pointer",
          },
        }}
      />
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <BlacklistForm
          client={selectedClient}
          onSave={handleSaveBlacklist}
          onCancel={handleCloseDialog}
        />
      </Dialog>{" "}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Client Details</Typography>
              <IconButton onClick={handleCloseDetailDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Name:
                </Typography>
                <Typography variant="body2">
                  {selectedClient?.firstName} {selectedClient?.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Email:
                </Typography>
                <Typography variant="body2">{selectedClient?.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Phone:
                </Typography>
                <Typography variant="body2">{selectedClient?.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Address:
                </Typography>
                <Typography variant="body2">
                  {selectedClient?.address?.street},{" "}
                  {selectedClient?.address?.city},{" "}
                  {selectedClient?.address?.state}{" "}
                  {selectedClient?.address?.zipCode},{" "}
                  {selectedClient?.address?.country}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Blacklist Reason:
                </Typography>
                <Typography variant="body2">
                  {selectedClient?.blacklistReason}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Date Added:
                </Typography>
                <Typography variant="body2">
                  {selectedClient?.createdAt?.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Dialog>
    </Box>
  );
}

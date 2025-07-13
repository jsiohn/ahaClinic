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
  TextField,
  InputAdornment,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Client } from "../../types/models";
import ClientForm from "./ClientForm";
import BlacklistForm from "../Blacklist/BlacklistForm";
import api from "../../utils/api";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../utils/auth";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openBlacklistDialog, setOpenBlacklistDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [duplicateConfirmDialog, setDuplicateConfirmDialog] = useState<{
    open: boolean;
    duplicates: any[];
    clientData: Partial<Client>;
  }>({ open: false, duplicates: [], clientData: {} });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get("/clients");

      // Transform the data to ensure each client has an id field
      const transformedData = Array.isArray(response)
        ? response.map((client: any) => ({
            ...client,
            id: client._id,
          }))
        : [];
      setClients(transformedData);
      setError("");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to fetch clients";
      setError(message);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClick = () => {
    setSelectedClient(null);
    setOpenDialog(true);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setOpenDialog(true);
  };

  const handleDeleteClick = async (client: Client) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${client.firstName} ${client.lastName}?`
      )
    ) {
      try {
        await api.delete(`/clients/${client.id}`);
        setClients((prevClients) =>
          prevClients.filter((c) => c.id !== client.id)
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to delete client"
        );
      }
    }
  };
  const handleToggleBlacklist = async (client: Client) => {
    try {
      // If already blacklisted, remove from blacklist
      if (client.isBlacklisted) {
        const updatedClient = {
          ...client,
          isBlacklisted: false,
          blacklistReason: "",
        };

        await api.put(`/clients/${client.id}`, updatedClient);
      } else {
        // If not blacklisted, show dialog to add to blacklist
        setSelectedClient(client);
        // Open blacklist dialog instead of form dialog
        setOpenBlacklistDialog(true);
        return; // Skip the fetch for now
      }

      await fetchClients(); // Refresh the list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update blacklist status"
      );
    }
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleCloseBlacklistDialog = () => {
    setOpenBlacklistDialog(false);
    setSelectedClient(null);
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleSaveBlacklist = async (clientData: Partial<Client>) => {
    try {
      // Update client with blacklist info
      await api.put(`/clients/${clientData.id}`, {
        ...clientData,
        isBlacklisted: true,
      });

      await fetchClients(); // Refresh the client list
      setOpenBlacklistDialog(false);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to blacklist client";
      setError(errorMessage);
    }
  };

  const checkForDuplicates = (clientData: Partial<Client>) => {
    const duplicates = [];

    // Check for duplicate phone numbers (non-empty)
    if (clientData.phone && clientData.phone.trim()) {
      const phoneMatches = clients.filter(
        (client) =>
          client.phone === clientData.phone &&
          (!selectedClient || client.id !== selectedClient.id)
      );
      if (phoneMatches.length > 0) {
        duplicates.push({
          field: "phone",
          value: clientData.phone,
          matches: phoneMatches,
        });
      }
    }

    // Check for duplicate emails (non-empty)
    if (clientData.email && clientData.email.trim()) {
      const emailMatches = clients.filter(
        (client) =>
          client.email === clientData.email &&
          (!selectedClient || client.id !== selectedClient.id)
      );
      if (emailMatches.length > 0) {
        duplicates.push({
          field: "email",
          value: clientData.email,
          matches: emailMatches,
        });
      }
    }

    // Check for duplicate name combinations
    if (clientData.firstName && clientData.lastName) {
      const nameMatches = clients.filter(
        (client) =>
          client.firstName?.toLowerCase() ===
            clientData.firstName?.toLowerCase() &&
          client.lastName?.toLowerCase() ===
            clientData.lastName?.toLowerCase() &&
          (!selectedClient || client.id !== selectedClient.id)
      );
      if (nameMatches.length > 0) {
        duplicates.push({
          field: "name",
          value: `${clientData.firstName} ${clientData.lastName}`,
          matches: nameMatches,
        });
      }
    }

    return duplicates;
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      // Clean up empty address fields before sending
      const formattedData: any = {
        ...clientData,
        // Convert empty email to null to work with sparse unique index
        email:
          clientData.email && clientData.email.trim() ? clientData.email : null,
        address: clientData.address
          ? {
              street: clientData.address.street || "",
              city: clientData.address.city || "",
              state: clientData.address.state || "",
              zipCode: clientData.address.zipCode || "",
              country: clientData.address.country || "",
              county: clientData.address.county || "",
            }
          : undefined,
      };

      // Check for duplicates only when creating new clients
      if (!selectedClient) {
        const duplicates = checkForDuplicates(formattedData);
        if (duplicates.length > 0) {
          setDuplicateConfirmDialog({
            open: true,
            duplicates,
            clientData: formattedData,
          });
          return; // Stop execution and wait for user confirmation
        }
      }

      await saveClientData(formattedData);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to save client";
      setError(errorMessage);
    }
  };

  const saveClientData = async (formattedData: Partial<Client>) => {
    let responseData: any;
    if (selectedClient) {
      // Update existing client
      responseData = await api.put<any>(
        `/clients/${selectedClient.id}`,
        formattedData
      );
    } else {
      // Create new client
      responseData = await api.post<any>("/clients", formattedData);
    }

    // Transform the response data to match Client type
    const transformedData: Client = {
      ...responseData,
      id: responseData._id || responseData.id,
      firstName: responseData.firstName,
      lastName: responseData.lastName,
      email: responseData.email,
      phone: responseData.phone,
      address: {
        street: responseData.address?.street || "",
        city: responseData.address?.city || "",
        state: responseData.address?.state || "",
        zipCode: responseData.address?.zipCode || "",
        country: responseData.address?.country || "",
        county: responseData.address?.county || "",
      },
      createdAt: new Date(responseData.createdAt),
      updatedAt: new Date(responseData.updatedAt),
    };

    if (selectedClient) {
      setClients((clients) =>
        clients.map((client) =>
          client.id === selectedClient.id ? transformedData : client
        )
      );
    } else {
      setClients((clients) =>
        Array.isArray(clients)
          ? [...clients, transformedData]
          : [transformedData]
      );
    }
    handleCloseDialog();
  };

  const handleDuplicateConfirmation = async (proceed: boolean) => {
    if (proceed) {
      try {
        await saveClientData(duplicateConfirmDialog.clientData);
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to save client";
        setError(errorMessage);
      }
    }
    setDuplicateConfirmDialog({ open: false, duplicates: [], clientData: {} });
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };
  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedClient(null);
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
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
  // Filter clients based on search term
  const filteredClients = clients.filter((client) => {
    if (!searchTerm.trim()) return true;

    const searchStr = searchTerm.toLowerCase().trim();
    const firstName = (client.firstName || "").toLowerCase();
    const lastName = (client.lastName || "").toLowerCase();
    const email = (client.email || "").toLowerCase();
    const phone = (client.phone || "").toLowerCase();
    const fullName = `${firstName} ${lastName}`;

    return (
      firstName.includes(searchStr) ||
      lastName.includes(searchStr) ||
      fullName.includes(searchStr) ||
      email.includes(searchStr) ||
      phone.includes(searchStr)
    );
  });

  const columns: GridColDef[] = [
    {
      field: "fullName",
      headerName: "Name",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Client>) => {
        const firstName = params.row.firstName || "";
        const lastName = params.row.lastName || "";
        return `${firstName} ${lastName}`.trim();
      },
    },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    {
      field: "isBlacklisted",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            color: params.row.isBlacklisted ? "error.main" : "success.main",
            typography: "body2",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          {params.row.isBlacklisted ? "Blacklisted" : "Active"}
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <PermissionGuard permission={PERMISSIONS.UPDATE_CLIENTS}>
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
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.UPDATE_BLACKLIST}>
            <Tooltip
              title={
                params.row.isBlacklisted
                  ? "Remove from Blacklist"
                  : "Add to Blacklist"
              }
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  handleToggleBlacklist(params.row);
                }}
                color={params.row.isBlacklisted ? "error" : "default"}
              >
                <BlockIcon />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.DELETE_CLIENTS}>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  handleDeleteClick(params.row);
                }}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
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
      </Snackbar>{" "}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Clients
        </Typography>{" "}
        <TextField
          placeholder="Search clients..."
          size="small"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", sm: 300 },
            maxWidth: 300,
          }}
        />{" "}
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <PermissionGuard permission={PERMISSIONS.CREATE_CLIENTS}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Add Client
            </Button>
          </PermissionGuard>
        </Box>
      </Box>{" "}
      <Box sx={{ width: "100%", overflow: "auto" }}>
        <DataGrid
          rows={filteredClients}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection={false}
          disableRowSelectionOnClick={false}
          disableVirtualization
          autoHeight
          loading={loading}
          onRowClick={handleRowClick}
          sx={{
            "& .MuiDataGrid-row": {
              cursor: "pointer",
            },
            minWidth: 0,
            width: "100%",
          }}
        />
      </Box>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
      >
        <ClientForm
          client={selectedClient}
          onSave={handleSaveClient}
          onCancel={handleCloseDialog}
        />
      </Dialog>
      {/* Blacklist Dialog */}
      <Dialog
        open={openBlacklistDialog}
        onClose={handleCloseBlacklistDialog}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
      >
        <BlacklistForm
          client={selectedClient}
          onSave={handleSaveBlacklist}
          onCancel={handleCloseBlacklistDialog}
        />
      </Dialog>
      {/* Client Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
      >
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2">
              Client Details
            </Typography>
            <IconButton onClick={handleCloseDetailDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Personal Information
              </Typography>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="body1" gutterBottom>
                    <strong>Name:</strong> {selectedClient?.firstName}{" "}
                    {selectedClient?.lastName}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Email:</strong> {selectedClient?.email}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Phone:</strong> {selectedClient?.phone}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Address
              </Typography>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="body1" gutterBottom>
                    <strong>Street:</strong>{" "}
                    {selectedClient?.address?.street || "N/A"}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>City:</strong>{" "}
                    {selectedClient?.address?.city || "N/A"}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>State:</strong>{" "}
                    {selectedClient?.address?.state || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Zip Code:</strong>{" "}
                    {selectedClient?.address?.zipCode || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>County:</strong>{" "}
                    {selectedClient?.address?.county || "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Status Information
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body1" gutterBottom>
                    <strong>Status:</strong>{" "}
                    <Box
                      component="span"
                      sx={{
                        color: selectedClient?.isBlacklisted
                          ? "error.main"
                          : "success.main",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedClient?.isBlacklisted ? "Blacklisted" : "Active"}
                    </Box>
                  </Typography>
                  {selectedClient?.isBlacklisted && (
                    <Typography variant="body1">
                      <strong>Blacklist Reason:</strong>{" "}
                      {selectedClient?.blacklistReason || "Not specified"}
                    </Typography>
                  )}
                  <Typography variant="body1" gutterBottom>
                    <strong>Created:</strong>{" "}
                    {selectedClient?.createdAt.toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Last Updated:</strong>{" "}
                    {selectedClient?.updatedAt.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                handleCloseDetailDialog();
                handleEditClick(selectedClient!);
              }}
              startIcon={<EditIcon />}
            >
              Edit Client
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseDetailDialog}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Dialog>
      {/* Duplicate Confirmation Dialog */}
      <Dialog
        open={duplicateConfirmDialog.open}
        onClose={() =>
          setDuplicateConfirmDialog({
            open: false,
            duplicates: [],
            clientData: {},
          })
        }
        maxWidth="md"
        fullWidth
        disableEnforceFocus
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Duplicate Client Detected
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            The following information matches existing clients:
          </Typography>

          {duplicateConfirmDialog.duplicates.map((duplicate, index) => (
            <Box
              key={index}
              sx={{ mb: 2, p: 2, bgcolor: "warning.light", borderRadius: 1 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Duplicate{" "}
                {duplicate.field === "name"
                  ? "Name"
                  : duplicate.field.charAt(0).toUpperCase() +
                    duplicate.field.slice(1)}
                : {duplicate.value}
              </Typography>

              {duplicate.matches.map((match: Client, matchIndex: number) => (
                <Typography key={matchIndex} variant="body2" sx={{ ml: 2 }}>
                  • {match.firstName} {match.lastName}
                  {match.phone && ` - ${match.phone}`}
                  {match.email && ` - ${match.email}`}
                </Typography>
              ))}
            </Box>
          ))}

          <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
            Do you want to create this client anyway?
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleDuplicateConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleDuplicateConfirmation(true)}
            >
              Create Anyway
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

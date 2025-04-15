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
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { Client } from "../../types/models";
import ClientForm from "./ClientForm";
import api from "../../utils/api";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
      await api.post(`/blacklist`, {
        client: client.id,
        reason: "Added to blacklist",
        addedBy: JSON.parse(localStorage.getItem("user") || "{}").username,
      });
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
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      // Clean up empty address fields before sending
      const formattedData = {
        ...clientData,
        address: Object.entries(clientData.address || {}).reduce(
          (acc, [key, value]) => {
            if (value && value.trim() !== "") {
              acc[key] = value.trim();
            }
            return acc;
          },
          {} as Record<string, string>
        ),
      };

      if (selectedClient) {
        // Update existing client
        const { data } = await api.put<any>(
          `/clients/${selectedClient.id}`,
          formattedData
        );
        const transformedData = { ...data, id: data._id || data.id } as Client;
        setClients((clients) =>
          clients.map((client) =>
            client.id === selectedClient.id ? transformedData : client
          )
        );
      } else {
        // Create new client
        const { data } = await api.post<any>("/clients", formattedData);
        const transformedData = { ...data, id: data._id || data.id } as Client;
        setClients((clients) =>
          Array.isArray(clients)
            ? [...clients, transformedData]
            : [transformedData]
        );
      }
      handleCloseDialog();
    } catch (error: any) {
      if (error?.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(
          error instanceof Error ? error.message : "Failed to save client"
        );
      }
    }
  };

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
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEditClick(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              params.row.isBlacklisted
                ? "Remove from Blacklist"
                : "Add to Blacklist"
            }
          >
            <IconButton
              size="small"
              onClick={() => handleToggleBlacklist(params.row)}
              color={params.row.isBlacklisted ? "error" : "default"}
            >
              <BlockIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row)}
              color="error"
            >
              <DeleteIcon />
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
        <Typography variant="h4" component="h1">
          Clients
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Add Client
        </Button>
      </Box>

      <DataGrid
        rows={clients}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[10, 20, 50]}
        checkboxSelection={false}
        disableRowSelectionOnClick
        autoHeight
        loading={loading}
      />

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <ClientForm
          client={selectedClient}
          onSave={handleSaveClient}
          onCancel={handleCloseDialog}
        />
      </Dialog>
    </Box>
  );
}

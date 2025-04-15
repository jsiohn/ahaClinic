import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { Client } from "../../types/models";
import BlacklistForm from "./BlacklistForm";

// Temporary mock data - replace with actual API call later
const mockBlacklistedClients: Client[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    address: "123 Problem St, City, State 12345",
    isBlacklisted: true,
    blacklistReason: "Multiple missed appointments and aggressive behavior",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-03-14"),
  },
];

export default function BlacklistPage() {
  const [blacklistedClients] = useState<Client[]>(mockBlacklistedClients);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleCreateClick = () => {
    setSelectedClient(null);
    setOpenDialog(true);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setOpenDialog(true);
  };

  const handleRemoveFromBlacklist = (client: Client) => {
    // Implement remove from blacklist functionality
    console.log("Remove from blacklist:", client);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const handleSaveBlacklist = (clientData: Partial<Client>) => {
    // Implement save functionality
    console.log("Save blacklisted client:", clientData);
    handleCloseDialog();
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
              onClick={() => handleEditClick(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove from Blacklist">
            <IconButton
              size="small"
              onClick={() => handleRemoveFromBlacklist(params.row)}
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
        disableRowSelectionOnClick
        autoHeight
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
      </Dialog>
    </Box>
  );
}

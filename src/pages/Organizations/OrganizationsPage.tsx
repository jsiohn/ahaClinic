import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { Organization } from "../../types/models";
import OrganizationForm from "./OrganizationForm";

// Temporary mock data - replace with actual API call later
const mockOrganizations: Organization[] = [
  {
    id: "1",
    name: "Happy Paws Rescue",
    contactPerson: "John Smith",
    email: "contact@happypawsrescue.org",
    phone: "(555) 123-4567",
    address: "123 Rescue Lane, City, State 12345",
    status: "ACTIVE",
    notes: "Specializes in dog rescue and rehabilitation",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-03-14"),
  },
];

export default function OrganizationsPage() {
  const [organizations] = useState<Organization[]>(mockOrganizations);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  const handleCreateClick = () => {
    setSelectedOrganization(null);
    setOpenDialog(true);
  };

  const handleEditClick = (organization: Organization) => {
    setSelectedOrganization(organization);
    setOpenDialog(true);
  };

  const handleDeleteClick = (organization: Organization) => {
    // Implement delete functionality
    console.log("Delete organization:", organization);
  };

  const handleEmailClick = (organization: Organization) => {
    // Implement email functionality
    window.location.href = `mailto:${organization.email}`;
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrganization(null);
  };

  const handleSaveOrganization = (organizationData: Partial<Organization>) => {
    // Implement save functionality
    console.log("Save organization:", organizationData);
    handleCloseDialog();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Organization Name",
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PetsIcon fontSize="small" />
          {params.value}
        </Box>
      ),
    },
    {
      field: "contactPerson",
      headerName: "Contact Person",
      width: 150,
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
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
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
          <Tooltip title="Email">
            <IconButton
              size="small"
              onClick={() => handleEmailClick(params.row)}
              color="primary"
            >
              <EmailIcon />
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" component="h1">
          Rescue Organizations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Add Organization
        </Button>
      </Box>

      <DataGrid
        rows={organizations}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "name", sort: "asc" }],
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
        <OrganizationForm
          organization={selectedOrganization}
          onSave={handleSaveOrganization}
          onCancel={handleCloseDialog}
        />
      </Dialog>
    </Box>
  );
}

// filepath: c:\Users\John\Documents\projects\soloProjects\ahaClinic\src\pages\Organizations\OrganizationsPage.tsx
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Snackbar,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Organization } from "../../types/models";
import OrganizationForm from "./OrganizationForm";
import OrganizationAnimals from "./OrganizationAnimals";
import api from "../../utils/api";

// Backend organization data structure might be different from frontend
interface ApiOrganization {
  _id: string;
  name: string;
  address?:
    | {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      }
    | string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  taxId?: string;
  businessHours?: {
    monday?: { open?: string; close?: string };
    tuesday?: { open?: string; close?: string };
    wednesday?: { open?: string; close?: string };
    thursday?: { open?: string; close?: string };
    friday?: { open?: string; close?: string };
    saturday?: { open?: string; close?: string };
    sunday?: { open?: string; close?: string };
  };
  // Additional fields that might be stored outside the schema
  contactPerson?: string;
  email?: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // Allow for any other properties
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAnimalsDialog, setOpenAnimalsDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Convert from API format to frontend Organization
  const transformApiToFrontend = (org: ApiOrganization): Organization => {
    // Extract contact information from nested structure or flat properties
    const contactPerson = org.contactPerson || "";

    const email = org.contactInfo?.email || org.email || "";
    const phone = org.contactInfo?.phone || org.phone || "";

    // Handle address - could be string, object, or nested object
    let address = "";
    if (typeof org.address === "string") {
      address = org.address;
    } else if (org.address) {
      const parts = [];
      if (org.address.street) parts.push(org.address.street);
      if (org.address.city) parts.push(org.address.city);
      if (org.address.state) parts.push(org.address.state);
      if (org.address.zipCode) parts.push(org.address.zipCode);
      if (org.address.country) parts.push(org.address.country);
      address = parts.join(", ");
    }
    const transformed = {
      id: org._id,
      name: org.name,
      contactPerson: contactPerson,
      email: email,
      phone: phone,
      address,
      status: org.status || "PENDING", // Get status from org object
      notes: org.notes || "",
      createdAt: new Date(org.createdAt),
      updatedAt: new Date(org.updatedAt),
    };

    return transformed;
  };
  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiOrganization[]>("/organizations");

      // Transform response data to match frontend model
      const transformedData = Array.isArray(response)
        ? response.map((org) => {
            // Make sure we don't use default values for existing data
            const transformed = transformApiToFrontend(org);
            return transformed;
          })
        : [];

      setOrganizations(transformedData);
      setError("");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err.message ||
        "Failed to fetch organizations";
      setError(message);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data from localStorage on initial render
  useEffect(() => {
    fetchOrganizations();

    // Check if there's any stored organization data
    const storedDialogState = localStorage.getItem("organizationDialogState");
    if (storedDialogState) {
      try {
        const { isOpen, organization } = JSON.parse(storedDialogState);
        if (isOpen) {
          setOpenDialog(true);
          if (organization) {
            // Convert date strings back to Date objects
            if (organization.createdAt) {
              organization.createdAt = new Date(organization.createdAt);
            }
            if (organization.updatedAt) {
              organization.updatedAt = new Date(organization.updatedAt);
            }
            setSelectedOrganization(organization);
          } else {
            setSelectedOrganization(null);
          }
        }
      } catch (err) {
        console.error("Error parsing stored organization data:", err);
        localStorage.removeItem("organizationDialogState");
      }
    }
  }, []);
  const handleCreateClick = () => {
    setSelectedOrganization(null);
    setOpenDialog(true);
    // Clear any saved form draft data
    localStorage.removeItem("organizationDraftFormData");
    // Store dialog state in localStorage
    localStorage.setItem(
      "organizationDialogState",
      JSON.stringify({
        isOpen: true,
        organization: null,
      })
    );
  };
  const handleEditClick = (organization: Organization) => {
    setSelectedOrganization(organization);
    setOpenDialog(true);
    // Clear any saved form draft data to prevent it from overriding the organization data
    localStorage.removeItem("organizationDraftFormData");
    // Store dialog state and organization data in localStorage
    localStorage.setItem(
      "organizationDialogState",
      JSON.stringify({
        isOpen: true,
        organization,
      })
    );
  };
  const handleDeleteClick = async (organization: Organization) => {
    if (
      window.confirm(`Are you sure you want to delete ${organization.name}?`)
    ) {
      try {
        await api.delete(`/organizations/${organization.id}`);

        // Only update the UI if deletion was successful
        setOrganizations((prevOrganizations) =>
          prevOrganizations.filter((org) => org.id !== organization.id)
        );
      } catch (err: any) {
        console.error("Error deleting organization:", err);

        let errorMessage = "Failed to delete organization";

        if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        }

        setError(errorMessage);
      }
    }
  };
  const handleEmailClick = (organization: Organization) => {
    window.location.href = `mailto:${organization.email}`;
  };

  const handleViewAnimalsClick = (organization: Organization) => {
    setSelectedOrganization(organization);
    setOpenAnimalsDialog(true);
  };

  const handleCloseAnimalsDialog = () => {
    setOpenAnimalsDialog(false);
    setSelectedOrganization(null);
  };
  const handleRowClick = (params: any) => {
    // Check if the click target is a button or icon
    const isActionButton = (params.event?.target as HTMLElement)?.closest(
      ".MuiIconButton-root"
    );
    // Also check if the click target is within the actions cell to handle any other elements in the actions column
    const isActionsCell = (params.event?.target as HTMLElement)?.closest(
      '[role="cell"][data-field="actions"]'
    );

    if (!isActionButton && !isActionsCell) {
      setSelectedOrganization(params.row);
      setOpenDetailDialog(true);
    }
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedOrganization(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrganization(null);
    // Clear the localStorage when dialog is closed
    localStorage.removeItem("organizationDialogState");
    // Also clear any saved form draft data
    localStorage.removeItem("organizationDraftFormData");
  };
  const handleSaveOrganization = async (
    organizationData: Partial<Organization>
  ) => {
    try {
      const formattedData = {
        name: organizationData.name || "",
        contactPerson: organizationData.contactPerson || "", // Explicitly include contactPerson at the root level
        contactInfo: {
          phone: organizationData.phone || "",
          email: organizationData.email || "",
        },
        // Handle address - parse from string to object if needed
        address:
          typeof organizationData.address === "string"
            ? { street: organizationData.address } // Put the whole address in the street field
            : organizationData.address || {},
        // Include status in the root level of the document
        status: organizationData.status || "PENDING",
        notes: organizationData.notes || "",
      }; // Log the formatted data being sent to API
      let responseData: ApiOrganization;
      if (selectedOrganization) {
        // Update existing organization
        responseData = await api.put(
          `/organizations/${selectedOrganization.id}`,
          formattedData
        );
      } else {
        // Create new organization
        responseData = await api.post("/organizations", formattedData);
      }

      // For newly created organizations, the API response might not include
      // all the fields we sent, so we need to merge the data
      const mergedData = {
        ...responseData,
        // Store contact info in both nested and flat structure for flexibility
        contactPerson: formattedData.contactPerson,
        status: formattedData.status,
        notes: formattedData.notes,
        contactInfo: {
          ...responseData.contactInfo,
          email: formattedData.contactInfo.email,
          phone: formattedData.contactInfo.phone,
        },
      }; // Transform the response data to match Organization type
      const transformedData = transformApiToFrontend(mergedData);

      if (selectedOrganization) {
        setOrganizations((organizations) =>
          organizations.map((org) =>
            org.id === selectedOrganization.id ? transformedData : org
          )
        );
      } else {
        setOrganizations((organizations) =>
          Array.isArray(organizations)
            ? [...organizations, transformedData]
            : [transformedData]
        );
      }

      // Clear localStorage on successful save
      localStorage.removeItem("organizationDialogState");
      handleCloseDialog();
    } catch (err: any) {
      console.error("Error saving organization:", err);

      let errorMessage = "Failed to save organization";

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(errorMessage);
    }
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

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter((org) => {
    if (!searchTerm.trim()) return true;

    const searchStr = searchTerm.toLowerCase().trim();
    const name = (org.name || "").toLowerCase();
    const contactPerson = (org.contactPerson || "").toLowerCase();
    const email = (org.email || "").toLowerCase();
    const phone = (org.phone || "").toLowerCase();
    const status = (org.status || "").toLowerCase();

    return (
      name.includes(searchStr) ||
      contactPerson.includes(searchStr) ||
      email.includes(searchStr) ||
      phone.includes(searchStr) ||
      status.includes(searchStr)
    );
  });

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
      width: 220,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          {" "}
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(params.row);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Email">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEmailClick(params.row);
              }}
              color="primary"
            >
              <EmailIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Animals">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleViewAnimalsClick(params.row);
              }}
              color="success"
            >
              <PetsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(params.row);
              }}
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
      </Snackbar>{" "}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Rescue Organizations
        </Typography>
        <TextField
          placeholder="Search organizations..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Add Organization
          </Button>
        </Box>
      </Box>
      <DataGrid
        rows={filteredOrganizations}
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
        disableRowSelectionOnClick={false}
        autoHeight
        loading={loading}
        onRowClick={handleRowClick}
        sx={{
          "& .MuiDataGrid-row": {
            cursor: "pointer",
          },
        }}
      />{" "}
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
      {/* Animals Dialog */}
      {selectedOrganization && (
        <OrganizationAnimals
          organization={selectedOrganization}
          open={openAnimalsDialog}
          onClose={handleCloseAnimalsDialog}
        />
      )}
      {/* Detail Dialog - New addition */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        {" "}
        <Box p={2}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Organization Details</Typography>
            <IconButton onClick={handleCloseDetailDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <Box mt={2}>
            <Typography variant="body1" fontWeight="medium">
              Name:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOrganization?.name}
            </Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body1" fontWeight="medium">
              Contact Person:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOrganization?.contactPerson}
            </Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body1" fontWeight="medium">
              Email:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOrganization?.email}
            </Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body1" fontWeight="medium">
              Phone:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOrganization?.phone}
            </Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body1" fontWeight="medium">
              Address:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOrganization?.address}
            </Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="body1" fontWeight="medium">
              Status:
            </Typography>
            <Chip
              label={selectedOrganization?.status}
              color={getStatusColor(selectedOrganization?.status || "") as any}
              size="small"
            />
          </Box>
          <Box mt={2}>
            <Typography variant="body1" fontWeight="medium">
              Notes:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOrganization?.notes}
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="flex-end" gap={1} mt={2} pb={2}>
            <Button
              variant="outlined"
              onClick={handleCloseDetailDialog}
              startIcon={<CloseIcon />}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

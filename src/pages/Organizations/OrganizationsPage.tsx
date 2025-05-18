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
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Convert from API format to frontend Organization
  const transformApiToFrontend = (org: ApiOrganization): Organization => {
    // Add debug logging
    console.log(
      "Raw organization data from API:",
      JSON.stringify(org, null, 2)
    );

    // Extract contact information from nested structure or flat properties
    const contactPerson = org.contactPerson || "";
    console.log(`Processing org: ${org.name}, contactPerson: ${contactPerson}`);

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

    console.log(
      "Transformed organization:",
      JSON.stringify(transformed, null, 2)
    );
    return transformed;
  };

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiOrganization[]>("/organizations");

      // Transform response data to match frontend model
      console.log("API response for organizations:", response);
      const transformedData = Array.isArray(response)
        ? response.map((org) => {
            // Make sure we don't use default values for existing data
            const transformed = transformApiToFrontend(org);
            console.log(`Organization ${org.name} - ID: ${transformed.id}`);
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
        console.log(`Deleting organization with ID: ${organization.id}`);
        const response = await api.delete(`/organizations/${organization.id}`);
        console.log("Delete response:", response);

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
      console.log("Saving organization data:", organizationData);

      // Log the raw input data
      console.log("Raw input data:", JSON.stringify(organizationData, null, 2));
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
      };

      // Log the formatted data being sent to API
      console.log(
        "Formatted data for API:",
        JSON.stringify(formattedData, null, 2)
      );

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
      console.log("API response:", responseData);

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
      };

      // Transform the response data to match Organization type
      const transformedData = transformApiToFrontend(mergedData);
      console.log("Transformed data:", transformedData);
      console.log("Organization ID:", transformedData.id);

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
          <Tooltip title="View Animals">
            <IconButton
              size="small"
              onClick={() => handleViewAnimalsClick(params.row)}
              color="success"
            >
              <PetsIcon />
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
        loading={loading}
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
    </Box>
  );
}

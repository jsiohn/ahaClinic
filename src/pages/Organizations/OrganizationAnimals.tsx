import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MedicalServices as MedicalIcon,
  Pets as PetsIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import { Animal, Organization, MedicalRecord } from "../../types/models";
import OrganizationAnimalForm from "./OrganizationAnimalForm";
import MedicalRecordForm from "../Animals/MedicalRecordForm";
import api from "../../utils/api";
import * as pdfUtils from "../../utils/pdfUtils";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../utils/auth";

interface OrganizationAnimalsProps {
  organization: Organization;
  open: boolean;
  onClose: () => void;
}

export default function OrganizationAnimals({
  organization,
  open,
  onClose,
}: OrganizationAnimalsProps) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openAnimalDialog, setOpenAnimalDialog] = useState(false);
  const [openMedicalDialog, setOpenMedicalDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  // PDF-related state
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentPdfFormTitle, setCurrentPdfFormTitle] =
    useState<string>("PDF Form");

  // Define available PDF forms
  const pdfForms = [
    { file: "clinicIntakeForm.pdf", title: "Intake Form" },
    { file: "clinicRabiesCert.pdf", title: "Rabies Certificate" },
    { file: "clinicTakehomeForm.pdf", title: "Take-home Form" },
    {
      file: "clinicVaxForm.pdf",
      title: "VAX Check In Form",
    },
  ];

  const fetchOrganizationAnimals = async () => {
    try {
      setLoading(true);
      // Fetch animals specifically filtered by organization
      const response = await api.get(
        `/animals?organization=${organization.id}`
      );
      const data = response.data || response;

      const transformedData = Array.isArray(data)
        ? data.map((animal: any) => ({
            id: animal._id,
            name: animal.name,
            species: animal.species,
            breed: animal.breed,
            age: animal.age,
            ageYears: animal.ageYears,
            ageMonths: animal.ageMonths,
            gender: animal.gender,
            weight: animal.weight != null ? parseFloat(animal.weight) : null,
            organization: animal.organization?._id || organization.id,
            organizationName: animal.organization?.name || organization.name,
            medicalHistory: animal.medicalHistory || [],
            microchipNumber: animal.microchipNumber,
            dateOfBirth: animal.dateOfBirth
              ? new Date(animal.dateOfBirth)
              : undefined,
            isSpayedNeutered: animal.isSpayedNeutered,
            spayNeuterDate: animal.spayNeuterDate
              ? new Date(animal.spayNeuterDate)
              : undefined,
            notes: animal.notes,
            isActive: animal.isActive,
            createdAt: new Date(animal.createdAt),
            updatedAt: new Date(animal.updatedAt),
          }))
        : [];

      setAnimals(transformedData);
    } catch (err: any) {
      console.error("Error fetching organization animals:", err);
      setError(
        err?.response?.data?.message || err.message || "Failed to fetch animals"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && organization) {
      fetchOrganizationAnimals();
    }
  }, [open, organization]);

  const handleCreateClick = () => {
    setSelectedAnimal(null);
    setOpenAnimalDialog(true);
  };

  const handleEditClick = (animal: Animal) => {
    setSelectedAnimal(animal);
    setOpenAnimalDialog(true);
  };

  const handleDeleteClick = async (animal: Animal) => {
    if (window.confirm(`Are you sure you want to delete ${animal.name}?`)) {
      try {
        await api.delete(`/animals/${animal.id}`);
        setAnimals(animals.filter((a) => a.id !== animal.id));
      } catch (err: any) {
        console.error("Error deleting animal:", err);
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to delete animal"
        );
      }
    }
  };

  const handleAddMedicalRecord = (animal: Animal) => {
    setSelectedAnimal(animal);
    setOpenMedicalDialog(true);
  };
  const handleCloseAnimalDialog = () => {
    setOpenAnimalDialog(false);
    setSelectedAnimal(null);
  };

  const handleCloseMedicalDialog = () => {
    setOpenMedicalDialog(false);
    setSelectedAnimal(null);
  };

  const handleRowClick = (params: any) => {
    // Check if the click target is within an action button to prevent dialog from opening
    const isActionButton = (params.event?.target as HTMLElement)?.closest(
      ".MuiIconButton-root"
    );
    // Also check if the click target is within the actions cell to handle any other elements in the actions column
    const isActionsCell = (params.event?.target as HTMLElement)?.closest(
      '[role="cell"][data-field="actions"]'
    );

    if (!isActionButton && !isActionsCell) {
      setSelectedAnimal(params.row);
      setOpenDetailDialog(true);
    }
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedAnimal(null);
  };

  const handleSaveMedicalRecord = async (data: Partial<MedicalRecord>) => {
    try {
      if (!selectedAnimal) return;

      const response = await api.post(
        `/animals/${selectedAnimal.id}/medical-records`,
        data
      );
      const updatedAnimal = response.data || response;

      setAnimals((prevAnimals) =>
        prevAnimals.map((animal) =>
          animal.id === updatedAnimal._id
            ? {
                ...updatedAnimal,
                id: updatedAnimal._id,
                organization:
                  updatedAnimal.organization?._id || organization.id,
                organizationName:
                  updatedAnimal.organization?.name || organization.name,
                medicalHistory: updatedAnimal.medicalHistory || [],
                microchipNumber: updatedAnimal.microchipNumber,
                dateOfBirth: updatedAnimal.dateOfBirth
                  ? new Date(updatedAnimal.dateOfBirth)
                  : undefined,
                isSpayedNeutered: updatedAnimal.isSpayedNeutered,
                spayNeuterDate: updatedAnimal.spayNeuterDate,
                notes: updatedAnimal.notes,
                isActive: updatedAnimal.isActive,
                createdAt: new Date(updatedAnimal.createdAt),
                updatedAt: new Date(updatedAnimal.updatedAt),
              }
            : animal
        )
      );

      handleCloseMedicalDialog();
    } catch (err: any) {
      console.error("Error adding medical record:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to add medical record"
      );
    }
  };
  const handleSaveAnimal = async (animalData: Partial<Animal>) => {
    try {
      if (selectedAnimal) {
        // Update existing animal
        const response = await api.put(
          `/animals/${selectedAnimal.id}`,
          animalData
        );
        const responseData = response.data || response;

        // Transform the received data
        const updatedAnimal: Animal = {
          id: responseData._id,
          name: responseData.name,
          species: responseData.species,
          breed: responseData.breed,
          age: responseData.age,
          ageYears: responseData.ageYears,
          ageMonths: responseData.ageMonths,
          gender: responseData.gender,
          weight:
            responseData.weight != null
              ? parseFloat(responseData.weight)
              : null,
          organization: responseData.organization?._id || organization.id,
          organizationName:
            responseData.organization?.name || organization.name,
          medicalHistory: responseData.medicalHistory || [],
          microchipNumber: responseData.microchipNumber,
          dateOfBirth: responseData.dateOfBirth
            ? new Date(responseData.dateOfBirth)
            : undefined,
          isSpayedNeutered: responseData.isSpayedNeutered,
          spayNeuterDate: responseData.spayNeuterDate
            ? new Date(responseData.spayNeuterDate)
            : undefined,
          notes: responseData.notes,
          isActive: responseData.isActive,
          createdAt: new Date(responseData.createdAt),
          updatedAt: new Date(responseData.updatedAt),
        };

        setAnimals((prevAnimals) =>
          prevAnimals.map((animal) =>
            animal.id === selectedAnimal.id ? updatedAnimal : animal
          )
        );
      } else {
        // Create new animal
        const response = await api.post("/animals", animalData);
        const responseData = response.data || response;

        // Transform the received data
        const newAnimal: Animal = {
          id: responseData._id,
          name: responseData.name,
          species: responseData.species,
          breed: responseData.breed,
          age: responseData.age,
          ageYears: responseData.ageYears,
          ageMonths: responseData.ageMonths,
          gender: responseData.gender,
          weight:
            responseData.weight != null
              ? parseFloat(responseData.weight)
              : null,
          organization: responseData.organization?._id || organization.id,
          organizationName:
            responseData.organization?.name || organization.name,
          medicalHistory: responseData.medicalHistory || [],
          microchipNumber: responseData.microchipNumber,
          dateOfBirth: responseData.dateOfBirth
            ? new Date(responseData.dateOfBirth)
            : undefined,
          isSpayedNeutered: responseData.isSpayedNeutered,
          spayNeuterDate: responseData.spayNeuterDate
            ? new Date(responseData.spayNeuterDate)
            : undefined,
          notes: responseData.notes,
          isActive: responseData.isActive,
          createdAt: new Date(responseData.createdAt),
          updatedAt: new Date(responseData.updatedAt),
        };

        setAnimals((prevAnimals) => [...prevAnimals, newAnimal]);
      }
      handleCloseAnimalDialog();
    } catch (err: any) {
      console.error("Error saving animal:", err);
      setError(
        err?.response?.data?.message || err.message || "Failed to save animal"
      );
    }
  };

  // PDF handlers
  const handleViewPdfForm = async (
    animal: Animal,
    formFile: string,
    formTitle: string
  ) => {
    try {
      setPdfLoading(true);
      setCurrentPdfFormTitle(formTitle);

      // Fetch the blank form
      const formResponse = await fetch(`/${formFile}`);
      if (!formResponse.ok) {
        throw new Error(
          `Failed to fetch PDF: ${formResponse.status} ${formResponse.statusText}`
        );
      }
      const formArrayBuffer = await formResponse.arrayBuffer();
      const formBytes = new Uint8Array(formArrayBuffer);

      // Prepare basic form data with animal information
      const formData: Record<string, any> = {
        "Animal Name": animal.name,
        "Animal Age": (() => {
          // Priority: use new ageYears/ageMonths format if available, fallback to old age field
          if (animal.ageYears !== undefined || animal.ageMonths !== undefined) {
            const years = animal.ageYears || 0;
            const months = animal.ageMonths || 0;
            if (years === 0 && months === 0) return "";
            if (years === 0) return `${months} months`;
            if (months === 0) return `${years} years`;
            return `${years} years, ${months} months`;
          }
          return animal.age ? `${animal.age} years` : "";
        })(),
        Weight: animal.weight?.toString() || "",
        Dog: animal.species === "DOG",
        "Domes. Cat":
          animal.species === "CAT" &&
          !(animal.breed || "").toLowerCase().includes("feral"),
        "Feral Cat":
          animal.species === "CAT" &&
          (animal.breed || "").toLowerCase().includes("feral"),
        Male: animal.gender?.toUpperCase() === "MALE",
        Female: animal.gender?.toUpperCase() === "FEMALE",
        "Don't Know": !animal.gender,
        "Description/Coloring": animal.breed || "",
        "Microchip Number": animal.microchipNumber || "N/A",
        "Date of Birth": animal.dateOfBirth
          ? new Date(animal.dateOfBirth).toLocaleDateString()
          : "",
        Date: new Date().toLocaleDateString(),
      };

      // Add organization contact information (address is a string, not object)
      Object.assign(formData, {
        "Client Name": organization.contactPerson || "",
        "Client Phone": organization.phone || "",
        "Client Email": organization.email || "",
        "Client Address": organization.address || "",
        "Client Address 2": "",
        County: "",
      });

      const filledPdfBytes = await pdfUtils.fillFormFields(formBytes, formData);
      const url = pdfUtils.createPdfUrl(filledPdfBytes);
      setPdfUrl(url);
      setOpenPdfDialog(true);
    } catch (error: any) {
      const errorMessage =
        error?.message || `Failed to generate ${formTitle.toLowerCase()}`;
      setError(errorMessage);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePdfMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    animal: Animal
  ) => {
    event.stopPropagation();
    setPdfMenuAnchor(event.currentTarget);
    setSelectedAnimal(animal);
  };

  const handlePdfMenuClose = () => {
    setPdfMenuAnchor(null);
  };

  const handlePdfFormSelect = (formFile: string, formTitle: string) => {
    if (selectedAnimal) {
      handleViewPdfForm(selectedAnimal, formFile, formTitle);
    }
    handlePdfMenuClose();
  };

  const handleClosePdfDialog = () => {
    setOpenPdfDialog(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      width: 150,
      flex: 1,
    },
    {
      field: "species",
      headerName: "Species",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={<PetsIcon />}
          label={params.value}
          color={params.value === "DOG" ? "primary" : "secondary"}
          size="small"
        />
      ),
    },
    {
      field: "breed",
      headerName: "Breed",
      width: 150,
      flex: 1,
    },
    {
      field: "age",
      headerName: "Age",
      width: 120,
      renderCell: (params: GridRenderCellParams<Animal>) => {
        const animal = params.row;
        // Priority: use new ageYears/ageMonths format if available, fallback to old age field
        if (animal.ageYears !== undefined || animal.ageMonths !== undefined) {
          const years = animal.ageYears || 0;
          const months = animal.ageMonths || 0;
          if (years === 0 && months === 0) return "Unknown";
          if (years === 0) return `${months}m`;
          if (months === 0) return `${years}y`;
          return `${years}y ${months}m`;
        }
        return animal.age ? `${animal.age}y` : "Unknown";
      },
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value.charAt(0).toUpperCase() + params.value.slice(1)}
          size="small"
          color={params.value === "male" ? "info" : "error"}
        />
      ),
    },
    {
      field: "weight",
      headerName: "Weight (lbs)",
      width: 130,
      renderCell: (params: GridRenderCellParams<Animal>) => {
        const weight = params.value;
        return weight != null ? `${weight} lbs` : "-";
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params: GridRenderCellParams<any, Animal>) => (
        <Box>
          <PermissionGuard permission={PERMISSIONS.UPDATE_ORGANIZATION_ANIMALS}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(params.row);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
          <Tooltip title="Add Medical Record">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleAddMedicalRecord(params.row);
              }}
              color="primary"
            >
              <MedicalIcon fontSize="small" />
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
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="PDF Forms">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handlePdfMenuClick(e, params.row);
              }}
              color="default"
            >
              <PdfIcon fontSize="small" />
              <ArrowDropDownIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{organization.name} - Animals</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1, display: "flex", justifyContent: "flex-end" }}>
          <PermissionGuard permission={PERMISSIONS.CREATE_ORGANIZATION_ANIMALS}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Add Animal
            </Button>
          </PermissionGuard>
        </Box>

        <DataGrid
          rows={animals}
          columns={columns}
          autoHeight
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
            sorting: {
              sortModel: [{ field: "name", sort: "asc" }],
            },
          }}
          loading={loading}
          disableRowSelectionOnClick={false}
          onRowClick={handleRowClick}
          sx={{
            "& .MuiDataGrid-row": {
              cursor: "pointer",
            },
          }}
        />

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Animal Form Dialog */}
      <Dialog
        open={openAnimalDialog}
        onClose={handleCloseAnimalDialog}
        maxWidth="md"
        fullWidth
      >
        <OrganizationAnimalForm
          animal={selectedAnimal}
          organization={organization}
          onSave={handleSaveAnimal}
          onCancel={handleCloseAnimalDialog}
        />
      </Dialog>

      {/* Medical Record Dialog */}
      <Dialog
        open={openMedicalDialog}
        onClose={handleCloseMedicalDialog}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
        aria-labelledby="medical-dialog-title"
      >
        <MedicalRecordForm
          animal={selectedAnimal}
          onSave={handleSaveMedicalRecord}
          onCancel={handleCloseMedicalDialog}
        />
      </Dialog>

      {/* Animal Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedAnimal?.name} - Details
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseDetailDialog}
            aria-label="close"
            size="small"
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Basic Information</Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedAnimal?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Species:</strong> {selectedAnimal?.species}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Breed:</strong> {selectedAnimal?.breed}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Age:</strong> {selectedAnimal?.age} yrs
                  </Typography>
                  <Typography variant="body2">
                    <strong>Gender:</strong> {selectedAnimal?.gender}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Weight:</strong>{" "}
                    {selectedAnimal?.weight != null
                      ? `${selectedAnimal.weight} lbs`
                      : "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Microchip:</strong>{" "}
                    {selectedAnimal?.microchipNumber || "Not microchipped"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date of Birth:</strong>{" "}
                    {selectedAnimal?.dateOfBirth
                      ? new Date(
                          selectedAnimal.dateOfBirth
                        ).toLocaleDateString()
                      : "Unknown"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Spayed/Neutered:</strong>{" "}
                    {selectedAnimal?.isSpayedNeutered ? "Yes" : "No"}
                    {selectedAnimal?.isSpayedNeutered &&
                      selectedAnimal?.spayNeuterDate && (
                        <span>
                          {" "}
                          (
                          {new Date(
                            selectedAnimal.spayNeuterDate
                          ).toLocaleDateString()}
                          )
                        </span>
                      )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Organization Details</Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2">
                    <strong>Organization:</strong>{" "}
                    {selectedAnimal?.organizationName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Contact:</strong> {organization.contactPerson}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {organization.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {organization.phone}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1">Medical History</Typography>
          {selectedAnimal &&
          selectedAnimal.medicalHistory &&
          selectedAnimal.medicalHistory.length > 0 ? (
            <Card variant="outlined">
              <CardContent>
                {selectedAnimal?.medicalHistory.map((record) => (
                  <Box
                    key={record.id}
                    sx={{
                      mb: 1,
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Date:</strong>{" "}
                      {new Date(record.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Procedure:</strong> {record.procedure}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Veterinarian:</strong> {record.veterinarian}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Notes:</strong> {record.notes}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No medical records found for this animal.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog
        open={openPdfDialog}
        onClose={handleClosePdfDialog}
        maxWidth="xl"
        fullWidth
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">{currentPdfFormTitle}</Typography>
          <IconButton onClick={handleClosePdfDialog}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: "80vh", p: 2 }}>
          {pdfLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              title={currentPdfFormTitle}
            />
          ) : (
            <Typography color="error">Failed to load PDF</Typography>
          )}
        </Box>
      </Dialog>

      {/* PDF Forms Menu */}
      <Menu
        anchorEl={pdfMenuAnchor}
        open={Boolean(pdfMenuAnchor)}
        onClose={handlePdfMenuClose}
      >
        {pdfForms.map((form) => (
          <MenuItem
            key={form.file}
            onClick={() => handlePdfFormSelect(form.file, form.title)}
          >
            {form.title}
          </MenuItem>
        ))}
      </Menu>
    </Dialog>
  );
}

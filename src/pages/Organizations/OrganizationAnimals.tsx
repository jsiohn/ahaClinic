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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Snackbar,
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
  Print as PrintIcon,
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
  const [selectedMedicalRecord, setSelectedMedicalRecord] =
    useState<MedicalRecord | null>(null);

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
          color: animal.color,
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
          vaccineDate: animal.vaccineDate
            ? new Date(animal.vaccineDate)
            : undefined,
          nextVaccineDate: animal.nextVaccineDate
            ? new Date(animal.nextVaccineDate)
            : undefined,
          county: animal.county,
          vaccineSerial: animal.vaccineSerial,
          lotExpiration: animal.lotExpiration
            ? new Date(animal.lotExpiration)
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
    setSelectedMedicalRecord(null);
    setOpenMedicalDialog(true);
  };
  const handleCloseAnimalDialog = () => {
    setOpenAnimalDialog(false);
    setSelectedAnimal(null);
  };

  const handleCloseMedicalDialog = () => {
    setOpenMedicalDialog(false);
    setSelectedAnimal(null);
    setSelectedMedicalRecord(null);
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

  const handleEditMedicalRecord = (
    animal: Animal,
    medicalRecord: MedicalRecord
  ) => {
    setSelectedAnimal(animal);
    setSelectedMedicalRecord(medicalRecord);
    setOpenMedicalDialog(true);
  };

  const handleDeleteMedicalRecord = async (
    animal: Animal,
    medicalRecord: MedicalRecord
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this medical record for ${medicalRecord.procedure}?`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/animals/${animal.id}/medical-records/${medicalRecord.id}`
      );

      // Update the animal in the local state
      setAnimals((prevAnimals) =>
        prevAnimals.map((a) =>
          a.id === animal.id
            ? {
              ...a,
              medicalHistory: a.medicalHistory.filter(
                (record) => record.id !== medicalRecord.id
              ),
            }
            : a
        )
      );

      // Update selectedAnimal if it's the same animal
      if (selectedAnimal?.id === animal.id) {
        setSelectedAnimal((prev) =>
          prev
            ? {
              ...prev,
              medicalHistory: prev.medicalHistory.filter(
                (record) => record.id !== medicalRecord.id
              ),
            }
            : null
        );
      }
    } catch (err: any) {
      console.error("Error deleting medical record:", err);
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to delete medical record"
      );
    }
  };

  const handlePrintMedicalHistory = async (animal: Animal) => {
    try {
      setPdfLoading(true);

      // Generate the medical history PDF
      const pdfBytes = await pdfUtils.generateMedicalHistoryPdf(animal);

      // Create URL and print
      const url = pdfUtils.createPdfUrl(pdfBytes);
      pdfUtils.printPdf(url);

      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (err: any) {
      console.error("Error generating medical history PDF:", err);
      setError("Failed to generate medical history PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSaveMedicalRecord = async (data: Partial<MedicalRecord>) => {
    try {
      if (!selectedAnimal) return;

      let response;
      if (selectedMedicalRecord) {
        // Update existing medical record
        const recordId = selectedMedicalRecord._id || selectedMedicalRecord.id;
        response = await api.put(
          `/animals/${selectedAnimal.id}/medical-records/${recordId}`,
          data
        );
      } else {
        // Create new medical record
        response = await api.post(
          `/animals/${selectedAnimal.id}/medical-records`,
          data
        );
      }

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
              spayNeuterDate: updatedAnimal.spayNeuterDate
                ? new Date(updatedAnimal.spayNeuterDate)
                : undefined,
              vaccineDate: updatedAnimal.vaccineDate
                ? new Date(updatedAnimal.vaccineDate)
                : undefined,
              nextVaccineDate: updatedAnimal.nextVaccineDate
                ? new Date(updatedAnimal.nextVaccineDate)
                : undefined,
              lotExpiration: updatedAnimal.lotExpiration
                ? new Date(updatedAnimal.lotExpiration)
                : undefined,
              notes: updatedAnimal.notes,
              isActive: updatedAnimal.isActive,
              createdAt: new Date(updatedAnimal.createdAt),
              updatedAt: new Date(updatedAnimal.updatedAt),
            }
            : animal
        )
      );

      // Update selectedAnimal if it's the same animal
      if (selectedAnimal?.id === updatedAnimal._id) {
        setSelectedAnimal({
          ...updatedAnimal,
          id: updatedAnimal._id,
          organization: updatedAnimal.organization?._id || organization.id,
          organizationName:
            updatedAnimal.organization?.name || organization.name,
          medicalHistory: updatedAnimal.medicalHistory || [],
          microchipNumber: updatedAnimal.microchipNumber,
          dateOfBirth: updatedAnimal.dateOfBirth
            ? new Date(updatedAnimal.dateOfBirth)
            : undefined,
          isSpayedNeutered: updatedAnimal.isSpayedNeutered,
          spayNeuterDate: updatedAnimal.spayNeuterDate
            ? new Date(updatedAnimal.spayNeuterDate)
            : undefined,
          vaccineDate: updatedAnimal.vaccineDate
            ? new Date(updatedAnimal.vaccineDate)
            : undefined,
          nextVaccineDate: updatedAnimal.nextVaccineDate
            ? new Date(updatedAnimal.nextVaccineDate)
            : undefined,
          lotExpiration: updatedAnimal.lotExpiration
            ? new Date(updatedAnimal.lotExpiration)
            : undefined,
          notes: updatedAnimal.notes,
          isActive: updatedAnimal.isActive,
          createdAt: new Date(updatedAnimal.createdAt),
          updatedAt: new Date(updatedAnimal.updatedAt),
        });
      }

      handleCloseMedicalDialog();
    } catch (err: any) {
      console.error("Error saving medical record:", err);
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to save medical record"
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
          color: responseData.color,
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
          vaccineDate: responseData.vaccineDate
            ? new Date(responseData.vaccineDate)
            : undefined,
          nextVaccineDate: responseData.nextVaccineDate
            ? new Date(responseData.nextVaccineDate)
            : undefined,
          county: responseData.county,
          vaccineSerial: responseData.vaccineSerial,
          lotExpiration: responseData.lotExpiration
            ? new Date(responseData.lotExpiration)
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
          color: responseData.color,
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
          vaccineDate: responseData.vaccineDate
            ? new Date(responseData.vaccineDate)
            : undefined,
          nextVaccineDate: responseData.nextVaccineDate
            ? new Date(responseData.nextVaccineDate)
            : undefined,
          county: responseData.county,
          vaccineSerial: responseData.vaccineSerial,
          lotExpiration: responseData.lotExpiration
            ? new Date(responseData.lotExpiration)
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
        "Animal Species": animal.species || "",
        "Animal Gender": animal.gender
          ? animal.gender.charAt(0).toUpperCase() + animal.gender.slice(1)
          : "",
        Canine: animal.species === "CANINE",
        "Domes. Feline":
          animal.species === "FELINE" &&
          !(animal.breed || "").toLowerCase().includes("feral"),
        "Feral Feline":
          animal.species === "FELINE" &&
          (animal.breed || "").toLowerCase().includes("feral"),
        Male: animal.gender?.toUpperCase() === "MALE",
        Female: animal.gender?.toUpperCase() === "FEMALE",
        "Don't Know": !animal.gender,
        "Animal Breed": animal.breed || "",
        "Animal Color": animal.color || "",
        "Microchip Number": animal.microchipNumber || "N/A",
        "Date of Birth": animal.dateOfBirth
          ? new Date(animal.dateOfBirth).toLocaleDateString()
          : "",
        "Vaccination Date": animal.vaccineDate
          ? new Date(animal.vaccineDate).toLocaleDateString()
          : "",
        "Vaccination Date Next": animal.nextVaccineDate
          ? new Date(animal.nextVaccineDate).toLocaleDateString()
          : "",
        "Tag Number": animal.tagNumber || "",
        "Vaccine Serial": animal.vaccineSerial || "",
        "Vaccine Lot Expiration": animal.lotExpiration
          ? new Date(animal.lotExpiration).toLocaleDateString()
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
        County: animal.county || "",
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
          color={params.value === "CANINE" ? "primary" : "secondary"}
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
      field: "color",
      headerName: "Color",
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
          medicalRecord={selectedMedicalRecord}
          onSave={handleSaveMedicalRecord}
          onCancel={handleCloseMedicalDialog}
        />
      </Dialog>
      {/* Animal Detail Dialog */}
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
              Animal Details
            </Typography>
            <IconButton onClick={handleCloseDetailDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {selectedAnimal && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Basic Information
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      <strong>Name:</strong> {selectedAnimal.name}
                    </Typography>
                    <Typography variant="body1" gutterBottom component="div">
                      <strong>Species:</strong>{" "}
                      <Chip
                        icon={<PetsIcon />}
                        label={selectedAnimal.species}
                        color={
                          selectedAnimal.species === "CANINE"
                            ? "primary"
                            : "secondary"
                        }
                        size="small"
                      />
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Breed:</strong>{" "}
                      {selectedAnimal.breed || "Not specified"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Color:</strong>{" "}
                      {selectedAnimal.color || "Not specified"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Age:</strong>{" "}
                      {(() => {
                        // Priority: use new ageYears/ageMonths format if available, fallback to old age field
                        if (
                          selectedAnimal.ageYears !== undefined ||
                          selectedAnimal.ageMonths !== undefined
                        ) {
                          const years = selectedAnimal.ageYears || 0;
                          const months = selectedAnimal.ageMonths || 0;
                          if (years === 0 && months === 0) return "Unknown";
                          if (years === 0) return `${months} months`;
                          if (months === 0) return `${years} years`;
                          return `${years} years, ${months} months`;
                        }
                        return selectedAnimal.age
                          ? `${selectedAnimal.age} years`
                          : "Unknown";
                      })()}
                    </Typography>
                    <Typography variant="body1" gutterBottom component="div">
                      <strong>Gender:</strong>{" "}
                      <Chip
                        label={
                          selectedAnimal.gender
                            ? selectedAnimal.gender.charAt(0).toUpperCase() +
                            selectedAnimal.gender.slice(1)
                            : "Unknown"
                        }
                        size="small"
                        color={
                          selectedAnimal.gender === "male" ? "info" : "error"
                        }
                      />
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Weight:</strong>{" "}
                      {selectedAnimal.weight != null
                        ? `${selectedAnimal.weight} lbs`
                        : "Unknown"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Microchip Number:</strong>{" "}
                      {selectedAnimal.microchipNumber || "Not microchipped"}
                    </Typography>
                    <Typography variant="body1">
                      <strong>County:</strong>{" "}
                      {selectedAnimal.county || "Not specified"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Medical Details
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      <strong>Date of Birth:</strong>{" "}
                      {selectedAnimal.dateOfBirth
                        ? new Date(
                          selectedAnimal.dateOfBirth
                        ).toLocaleDateString()
                        : "Unknown"}
                    </Typography>
                    <Typography variant="body1" gutterBottom component="div">
                      <strong>Spayed/Neutered:</strong>{" "}
                      {selectedAnimal.isSpayedNeutered ? (
                        <>
                          <Chip label="Yes" color="success" size="small" />
                          {selectedAnimal.spayNeuterDate && (
                            <span
                              style={{ marginLeft: "8px", fontSize: "0.9em" }}
                            >
                              (
                              {new Date(
                                selectedAnimal.spayNeuterDate
                              ).toLocaleDateString()}
                              )
                            </span>
                          )}
                        </>
                      ) : (
                        <Chip label="No" color="error" size="small" />
                      )}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Vaccine Date:</strong>{" "}
                      {selectedAnimal.vaccineDate
                        ? new Date(
                          selectedAnimal.vaccineDate
                        ).toLocaleDateString()
                        : "Not specified"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Next Vaccine Date:</strong>{" "}
                      {selectedAnimal.nextVaccineDate
                        ? new Date(
                          selectedAnimal.nextVaccineDate
                        ).toLocaleDateString()
                        : "Not specified"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Vaccine Serial #:</strong>{" "}
                      {selectedAnimal.vaccineSerial || "Not specified"}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Lot Expiration:</strong>{" "}
                      {selectedAnimal.lotExpiration
                        ? new Date(
                          selectedAnimal.lotExpiration
                        ).toLocaleDateString()
                        : "Not specified"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Organization Information
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      <strong>Organization:</strong>{" "}
                      {selectedAnimal.organizationName}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Contact:</strong> {organization.contactPerson}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Email:</strong> {organization.email}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Phone:</strong> {organization.phone}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Medical History
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    {selectedAnimal.medicalHistory &&
                      selectedAnimal.medicalHistory.length > 0 ? (
                      <List>
                        {selectedAnimal.medicalHistory.map((record, index) => (
                          <ListItem
                            key={record._id || record.id || index}
                            divider={
                              index < selectedAnimal.medicalHistory.length - 1
                            }
                          >
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2">
                                  {`${new Date(
                                    record.date
                                  ).toLocaleDateString()} - ${record.procedure
                                    }`}
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    component="span"
                                    display="block"
                                  >
                                    <strong>Veterinarian:</strong>{" "}
                                    {record.veterinarian}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    component="span"
                                    display="block"
                                  >
                                    <strong>Notes:</strong> {record.notes}
                                  </Typography>
                                </>
                              }
                            />
                            <ListItemSecondaryAction>
                              <PermissionGuard
                                permission={PERMISSIONS.UPDATE_MEDICAL_RECORDS}
                              >
                                <Tooltip title="Edit Medical Record">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      handleCloseDetailDialog();
                                      handleEditMedicalRecord(
                                        selectedAnimal,
                                        record
                                      );
                                    }}
                                    color="primary"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              </PermissionGuard>
                              <PermissionGuard
                                permission={PERMISSIONS.DELETE_MEDICAL_RECORDS}
                              >
                                <Tooltip title="Delete Medical Record">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeleteMedicalRecord(
                                        selectedAnimal,
                                        record
                                      )
                                    }
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </PermissionGuard>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body1">
                        No medical history available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Action buttons */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                handleCloseDetailDialog();
                handleEditClick(selectedAnimal!);
              }}
              startIcon={<EditIcon />}
            >
              Edit Animal
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                handleCloseDetailDialog();
                handleAddMedicalRecord(selectedAnimal!);
              }}
              startIcon={<MedicalIcon />}
            >
              Add Medical Record
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                if (selectedAnimal) {
                  handlePrintMedicalHistory(selectedAnimal);
                }
              }}
              startIcon={<PrintIcon />}
              disabled={pdfLoading}
            >
              Print Medical History
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
      </Dialog>{" "}
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
      {/* Error Snackbar */}
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
    </Dialog>
  );
}

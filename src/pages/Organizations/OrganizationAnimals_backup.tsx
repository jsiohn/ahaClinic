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
  const [openAnimalDialog, setOpenAnimalDialog] = useState(false);  const [openMedicalDialog, setOpenMedicalDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentPdfFormTitle, setCurrentPdfFormTitle] = useState<string>("PDF Form");

  // Define available PDF forms
  const pdfForms = [
    { file: "clinicIntakeForm.pdf", title: "Intake Form" },
    { file: "clinicDoaReg.pdf", title: "DOA Registration" },
    { file: "clinicRabiesCert.pdf", title: "Rabies Certificate" },
    { file: "clinicTakehomeForm.pdf", title: "Take-home Form" },
  ];

  const fetchOrganizationAnimals = async () => {
    try {
      setLoading(true);
      // Fetch animals specifically filtered by organization
      const response = await api.get(
        `/animals?organization=${organization.id}`
      );
      const data = response.data || response;        const transformedData = Array.isArray(data)
        ? data.map((animal: any) => ({
            id: animal._id,
            name: animal.name,
            species: animal.species,
            breed: animal.breed,
            age: animal.age,
            gender: animal.gender,
            weight: animal.weight != null ? parseFloat(animal.weight) : null,
            organization: animal.organization?._id || organization.id,
            organizationName: animal.organization?.name || organization.name,
            medicalHistory: animal.medicalHistory || [],
            microchipNumber: animal.microchipNumber,
            dateOfBirth: animal.dateOfBirth ? new Date(animal.dateOfBirth) : new Date(),
            isSpayedNeutered: animal.isSpayedNeutered,
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
        setAnimals((prevAnimals) =>
          prevAnimals.filter((a) => a.id !== animal.id)
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to delete animal"
        );
      }
    }
  };

  const handleCloseAnimalDialog = () => {
    setOpenAnimalDialog(false);
    setSelectedAnimal(null);
  };

  const handleAddMedicalRecord = (animal: Animal) => {
    setSelectedAnimal(animal);
    setOpenMedicalDialog(true);
  };

  const handleCloseMedicalDialog = () => {
    setOpenMedicalDialog(false);
    setSelectedAnimal(null);
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

      // Save medical record to API
      await api.post(`/animals/${selectedAnimal.id}/medical-records`, data);

      // Refresh animal data
      await fetchOrganizationAnimals();

      handleCloseMedicalDialog();
    } catch (err: any) {
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
          age: responseData.age,
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
          dateOfBirth: responseData.dateOfBirth ? new Date(responseData.dateOfBirth) : new Date(),
          isSpayedNeutered: responseData.isSpayedNeutered,
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
        const responseData = response.data || response;        // Transform the received data
        const newAnimal: Animal = {
          id: responseData._id,
          name: responseData.name,
          species: responseData.species,
          breed: responseData.breed,
          age: responseData.age,
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
          dateOfBirth: responseData.dateOfBirth ? new Date(responseData.dateOfBirth) : new Date(),
          isSpayedNeutered: responseData.isSpayedNeutered,
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
  const handleViewPdfForm = async (animal: Animal, formFile: string, formTitle: string) => {
    try {
      setPdfLoading(true);
      setCurrentPdfFormTitle(formTitle);

      // Fetch the blank form
      const formResponse = await fetch(`/src/assets/${formFile}`);
      const formArrayBuffer = await formResponse.arrayBuffer();
      const formBytes = new Uint8Array(formArrayBuffer);

      // Prepare basic form data with animal information
      const formData: Record<string, any> = {
        "Animal Name": animal.name,
        "Animal Age": animal.age?.toString() || "",
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

      // Add organization contact information
      Object.assign(formData, {
        "Client Name": organization.contactPerson || "",
        "Client Phone": organization.phone || "",
        "Client Email": organization.email || "",
        "Client Address": organization.address
          ? `${organization.address.street}, ${organization.address.city}`
          : "",
        "Client Address 2": organization.address
          ? `${organization.address.state} ${organization.address.zipCode}`
          : "",
        County: "",
      });

      const filledPdfBytes = await pdfUtils.fillFormFields(formBytes, formData);
      const url = pdfUtils.createPdfUrl(filledPdfBytes);
      setPdfUrl(url);
      setOpenPdfDialog(true);
    } catch (error: any) {
      const errorMessage = error?.message || `Failed to generate ${formTitle.toLowerCase()}`;
      setError(errorMessage);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePdfMenuClick = (event: React.MouseEvent<HTMLElement>, animal: Animal) => {
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
      setPdfUrl(null);    }
  };

  // PDF handlers
  const handleViewPdfForm = async (animal: Animal, formFile: string, formTitle: string) => {
    try {
      setPdfLoading(true);
      setCurrentPdfFormTitle(formTitle);

      // Fetch the blank form
      const formResponse = await fetch(`/src/assets/${formFile}`);
      const formArrayBuffer = await formResponse.arrayBuffer();
      const formBytes = new Uint8Array(formArrayBuffer);

      // Prepare basic form data with animal information
      const formData: Record<string, any> = {
        "Animal Name": animal.name,
        "Animal Age": animal.age?.toString() || "",
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

      // Add organization contact information
      Object.assign(formData, {
        "Client Name": organization.contactPerson || "",
        "Client Phone": organization.phone || "",
        "Client Email": organization.email || "",
        "Client Address": organization.address
          ? `${organization.address.street}, ${organization.address.city}`
          : "",
        "Client Address 2": organization.address
          ? `${organization.address.state} ${organization.address.zipCode}`
          : "",
        County: "",
      });

      const filledPdfBytes = await pdfUtils.fillFormFields(formBytes, formData);
      const url = pdfUtils.createPdfUrl(filledPdfBytes);
      setPdfUrl(url);
      setOpenPdfDialog(true);
    } catch (error: any) {
      const errorMessage = error?.message || `Failed to generate ${formTitle.toLowerCase()}`;
      setError(errorMessage);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePdfMenuClick = (event: React.MouseEvent<HTMLElement>, animal: Animal) => {
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
      width: 80,
      valueFormatter: (params: any) => {
        return params.value ? `${params.value} yrs` : "-";
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
      width: 180,
      renderCell: (params: GridRenderCellParams<any, Animal>) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEditClick(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Medical Record">
            <IconButton
              size="small"
              onClick={() => handleAddMedicalRecord(params.row)}
              color="primary"
            >
              <MedicalIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
         
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
          <Divider sx={{ my: 2 }} />{" "}
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
                    {" "}
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
    </Dialog>
  );
}

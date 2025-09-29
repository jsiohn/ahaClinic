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
  Autocomplete,
  TextField,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
} from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  MedicalServices as MedicalIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import { Animal, MedicalRecord, Client } from "../../types/models";
import AnimalForm from "./AnimalForm";
import MedicalRecordForm from "./MedicalRecordForm";
import api from "../../utils/api";
import * as pdfUtils from "../../utils/pdfUtils";
import { formatDateForDisplay } from "../../utils/dateUtils";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../utils/auth";

export default function AnimalsPage() {
  // State declarations
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openAnimalDialog, setOpenAnimalDialog] = useState(false);
  const [openMedicalDialog, setOpenMedicalDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedMedicalRecord, setSelectedMedicalRecord] =
    useState<MedicalRecord | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentPdfFormTitle, setCurrentPdfFormTitle] =
    useState<string>("PDF Form");
  const [duplicateAnimalConfirmDialog, setDuplicateAnimalConfirmDialog] =
    useState<{
      open: boolean;
      duplicates: any[];
      animalData: Partial<Animal>;
    }>({ open: false, duplicates: [], animalData: {} });

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

  const fetchClients = async () => {
    try {
      const response = await api.get("/clients");
      const transformedData = Array.isArray(response)
        ? response.map((client: any) => ({
            ...client,
            id: client._id,
          }))
        : [];
      setClients(transformedData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Failed to fetch clients"
      );
    }
  };

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const data = await api.get("/animals");
      const transformedData = Array.isArray(data)
        ? data
            .filter((animal: any) => !animal.organization) // Filter out animals that belong to organizations
            .map((animal: any) => ({
              ...animal,
              id: animal._id,
              client: animal.client?._id, // Make client reference optional
              weight: animal.weight != null ? parseFloat(animal.weight) : null,
              clientName: animal.client
                ? `${animal.client.firstName} ${animal.client.lastName}`
                : "No Client",
              dateOfBirth: animal.dateOfBirth
                ? new Date(animal.dateOfBirth)
                : undefined,
              spayNeuterDate: animal.spayNeuterDate
                ? new Date(animal.spayNeuterDate)
                : undefined,
              vaccineDate: animal.vaccineDate
                ? new Date(animal.vaccineDate)
                : undefined,
              nextVaccineDate: animal.nextVaccineDate
                ? new Date(animal.nextVaccineDate)
                : undefined,
              lotExpiration: animal.lotExpiration
                ? new Date(animal.lotExpiration)
                : undefined,
              createdAt: new Date(animal.createdAt),
              updatedAt: new Date(animal.updatedAt),
            }))
        : [];
      setAnimals(transformedData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Failed to fetch animals"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchAnimals(), fetchClients()]);
  }, []);
  const filteredAnimals = selectedClient
    ? animals.filter((animal) => animal.client === selectedClient._id)
    : animals;

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

  const handleAddMedicalRecord = (animal: Animal) => {
    setSelectedAnimal(animal);
    setSelectedMedicalRecord(null); // Clear any existing selected record
    setOpenMedicalDialog(true);
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
    const recordId = medicalRecord._id || medicalRecord.id;
    if (
      window.confirm(
        `Are you sure you want to delete this medical record for ${medicalRecord.procedure}?`
      )
    ) {
      try {
        const response = await api.delete(
          `/animals/${animal.id}/medical-records/${recordId}`
        );
        const updatedAnimal = response.data || response;

        setAnimals((prevAnimals: Animal[]) =>
          prevAnimals.map((a: Animal) =>
            a.id === updatedAnimal._id
              ? {
                  ...updatedAnimal,
                  id: updatedAnimal._id,
                  client: updatedAnimal.client?._id,
                  clientName: updatedAnimal.client
                    ? `${updatedAnimal.client.firstName} ${updatedAnimal.client.lastName}`
                    : "No Client",
                }
              : a
          )
        );

        // Update selectedAnimal if it's the same animal
        if (selectedAnimal?.id === animal.id) {
          setSelectedAnimal({
            ...updatedAnimal,
            id: updatedAnimal._id,
            client: updatedAnimal.client?._id,
            clientName: updatedAnimal.client
              ? `${updatedAnimal.client.firstName} ${updatedAnimal.client.lastName}`
              : "No Client",
          });
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to delete medical record"
        );
      }
    }
  };

  const handleCloseAnimalDialog = () => {
    setOpenAnimalDialog(false);
    setSelectedAnimal(null);
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleCloseMedicalDialog = () => {
    setOpenMedicalDialog(false);
    setSelectedAnimal(null);
    setSelectedMedicalRecord(null); // Clear selected medical record
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };
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
      const formBytes = new Uint8Array(formArrayBuffer); // Prepare basic form data with animal information
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
          ? formatDateForDisplay(animal.dateOfBirth)
          : "",
        "Vaccination Date": animal.vaccineDate
          ? formatDateForDisplay(animal.vaccineDate)
          : "",
        "Vaccination Date Next": animal.nextVaccineDate
          ? formatDateForDisplay(animal.nextVaccineDate)
          : "",
        "Tag Number": animal.tagNumber || "",
        "Vaccine Serial": animal.vaccineSerial || "",
        "Vaccine Manufacturer": animal.vaccineManufacturer || "",
        "Vaccine Lot Expiration": animal.lotExpiration
          ? new Date(animal.lotExpiration).toLocaleDateString()
          : "",
        Date: new Date().toLocaleDateString(),
      };

      // Add client information if available
      if (animal.client) {
        const clientResponse = await api.get(`/clients/${animal.client}`);
        const client = clientResponse.data || clientResponse;
        if (client) {
          Object.assign(formData, {
            "Client Name": `${client.firstName} ${client.lastName}`,
            "Client Phone": client.phone || "",
            "Client Email": client.email || "",
            "Client Address": client.address
              ? `${client.address.street}, ${client.address.city}`
              : "",
            "Client Address 2": client.address
              ? `${client.address.state} ${client.address.zipCode}`
              : "",
            County: client.address?.county || "",
          });
        }
      }

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
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to print medical history";
      setError(errorMessage);
    } finally {
      setPdfLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1 },
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
    { field: "breed", headerName: "Breed", flex: 1 },
    { field: "color", headerName: "Color", flex: 1 },
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
      field: "clientName", // Changed from client to clientName
      headerName: "Owner",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <PermissionGuard permission={PERMISSIONS.UPDATE_ANIMALS}>
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
          <PermissionGuard permission={PERMISSIONS.CREATE_MEDICAL_RECORDS}>
            <Tooltip title="Add Medical Record">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  handleAddMedicalRecord(params.row);
                }}
                color="primary"
              >
                <MedicalIcon />
              </IconButton>
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.DELETE_ANIMALS}>
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
          </PermissionGuard>{" "}
          <Tooltip title="PDF Forms">
            <IconButton
              size="small"
              onClick={(e) => handlePdfMenuClick(e, params.row)}
              color="default"
            >
              <PdfIcon />
              <ArrowDropDownIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
  const handleRowClick = (params: GridRowParams<Animal>) => {
    setSelectedAnimal(params.row);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedAnimal(null);
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };
  const handleClientChange = (_: unknown, newValue: Client | null) => {
    setSelectedClient(newValue);
  };

  const checkForAnimalDuplicates = (animalData: Partial<Animal>) => {
    const duplicates = [];

    // Check for duplicate microchip numbers (non-empty)
    if (animalData.microchipNumber && animalData.microchipNumber.trim()) {
      const microchipMatches = animals.filter(
        (animal) =>
          animal.microchipNumber === animalData.microchipNumber &&
          (!selectedAnimal || animal.id !== selectedAnimal.id)
      );
      if (microchipMatches.length > 0) {
        duplicates.push({
          field: "microchip",
          value: animalData.microchipNumber,
          matches: microchipMatches,
        });
      }
    }

    // Check for duplicate tag numbers (non-empty)
    if (animalData.tagNumber && animalData.tagNumber.trim()) {
      const tagMatches = animals.filter(
        (animal) =>
          animal.tagNumber === animalData.tagNumber &&
          (!selectedAnimal || animal.id !== selectedAnimal.id)
      );
      if (tagMatches.length > 0) {
        duplicates.push({
          field: "tag",
          value: animalData.tagNumber,
          matches: tagMatches,
        });
      }
    }

    // Check for duplicate name + client combinations
    if (animalData.name && animalData.client) {
      const nameClientMatches = animals.filter(
        (animal) =>
          animal.name?.toLowerCase() === animalData.name?.toLowerCase() &&
          animal.client === animalData.client &&
          (!selectedAnimal || animal.id !== selectedAnimal.id)
      );
      if (nameClientMatches.length > 0) {
        duplicates.push({
          field: "name_client",
          value: `${animalData.name} (same client)`,
          matches: nameClientMatches,
        });
      }
    }

    return duplicates;
  };
  const handleSaveAnimal = async (animalData: Partial<Animal>) => {
    try {
      // Check for duplicates only when creating new animals
      if (!selectedAnimal) {
        const duplicates = checkForAnimalDuplicates(animalData);
        if (duplicates.length > 0) {
          setDuplicateAnimalConfirmDialog({
            open: true,
            duplicates,
            animalData,
          });
          return; // Stop execution and wait for user confirmation
        }
      }

      await saveAnimalData(animalData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Failed to save animal"
      );
    }
  };

  const saveAnimalData = async (animalData: Partial<Animal>) => {
    if (selectedAnimal) {
      // Update existing animal
      const response = await api.put(
        `/animals/${selectedAnimal.id}`,
        animalData
      );
      const updatedAnimal = response.data || response;
      setAnimals((prevAnimals: Animal[]) =>
        prevAnimals.map((animal: Animal) =>
          animal.id === updatedAnimal._id
            ? {
                ...updatedAnimal,
                id: updatedAnimal._id,
                client: updatedAnimal.client?._id,
                clientName: updatedAnimal.client
                  ? `${updatedAnimal.client.firstName} ${updatedAnimal.client.lastName}`
                  : "No Client",
                dateOfBirth: updatedAnimal.dateOfBirth
                  ? new Date(updatedAnimal.dateOfBirth)
                  : undefined,
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
                createdAt: new Date(updatedAnimal.createdAt),
                updatedAt: new Date(updatedAnimal.updatedAt),
              }
            : animal
        )
      );
    } else {
      // Create new animal
      const response = await api.post("/animals", animalData);
      const newAnimal = response.data || response;
      setAnimals((prevAnimals: Animal[]) => [
        ...prevAnimals,
        {
          ...newAnimal,
          id: newAnimal._id,
          client: newAnimal.client?._id,
          clientName: newAnimal.client
            ? `${newAnimal.client.firstName} ${newAnimal.client.lastName}`
            : "No Client",
          dateOfBirth: newAnimal.dateOfBirth
            ? new Date(newAnimal.dateOfBirth)
            : undefined,
          spayNeuterDate: newAnimal.spayNeuterDate
            ? new Date(newAnimal.spayNeuterDate)
            : undefined,
          vaccineDate: newAnimal.vaccineDate
            ? new Date(newAnimal.vaccineDate)
            : undefined,
          nextVaccineDate: newAnimal.nextVaccineDate
            ? new Date(newAnimal.nextVaccineDate)
            : undefined,
          lotExpiration: newAnimal.lotExpiration
            ? new Date(newAnimal.lotExpiration)
            : undefined,
          createdAt: new Date(newAnimal.createdAt),
          updatedAt: new Date(newAnimal.updatedAt),
        },
      ]);
    }
    handleCloseAnimalDialog();
  };

  const handleAnimalDuplicateConfirmation = async (proceed: boolean) => {
    if (proceed) {
      try {
        await saveAnimalData(duplicateAnimalConfirmDialog.animalData);
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to save animal";
        setError(errorMessage);
      }
    }
    setDuplicateAnimalConfirmDialog({
      open: false,
      duplicates: [],
      animalData: {},
    });
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  const handleSaveMedicalRecord = async (
    recordData: Partial<MedicalRecord>
  ) => {
    try {
      if (!selectedAnimal) return;

      let response;
      if (selectedMedicalRecord) {
        // Update existing medical record
        const recordId = selectedMedicalRecord._id || selectedMedicalRecord.id;
        response = await api.put(
          `/animals/${selectedAnimal.id}/medical-records/${recordId}`,
          recordData
        );
      } else {
        // Create new medical record
        response = await api.post(
          `/animals/${selectedAnimal.id}/medical-records`,
          recordData
        );
      }

      const updatedAnimal = response.data || response;

      setAnimals((prevAnimals: Animal[]) =>
        prevAnimals.map((animal: Animal) =>
          animal.id === updatedAnimal._id
            ? {
                ...updatedAnimal,
                id: updatedAnimal._id,
                client: updatedAnimal.client?._id,
                clientName: updatedAnimal.client
                  ? `${updatedAnimal.client.firstName} ${updatedAnimal.client.lastName}`
                  : "No Client",
                dateOfBirth: updatedAnimal.dateOfBirth
                  ? new Date(updatedAnimal.dateOfBirth)
                  : undefined,
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
          client: updatedAnimal.client?._id,
          clientName: updatedAnimal.client
            ? `${updatedAnimal.client.firstName} ${updatedAnimal.client.lastName}`
            : "No Client",
          dateOfBirth: updatedAnimal.dateOfBirth
            ? new Date(updatedAnimal.dateOfBirth)
            : undefined,
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
          createdAt: new Date(updatedAnimal.createdAt),
          updatedAt: new Date(updatedAnimal.updatedAt),
        });
      }

      handleCloseMedicalDialog();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save medical record"
      );
    }
  };
  const handleClosePdfDialog = () => {
    setOpenPdfDialog(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    // Clear focus to prevent aria-hidden accessibility warning
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

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
        <Typography variant="h4" component="h1" sx={{ flexShrink: 0 }}>
          Animals
        </Typography>{" "}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flex: 1,
            mx: 2,
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", sm: 300 },
              maxWidth: 300,
            }}
          >
            <Autocomplete
              options={clients}
              getOptionLabel={(client) =>
                `${client.firstName} ${client.lastName}`
              }
              renderInput={(params) => (
                <TextField {...params} label="Filter by Client" size="small" />
              )}
              value={selectedClient}
              onChange={handleClientChange}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
            />
          </Box>
        </Box>
        <PermissionGuard permission={PERMISSIONS.CREATE_ANIMALS}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            sx={{
              flexShrink: 0,
            }}
          >
            Add Animal
          </Button>
        </PermissionGuard>
      </Box>
      <Box sx={{ width: "100%", overflow: "auto" }}>
        <DataGrid
          rows={filteredAnimals}
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
        open={openAnimalDialog}
        onClose={handleCloseAnimalDialog}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
        aria-labelledby="animal-dialog-title"
      >
        <AnimalForm
          animal={selectedAnimal}
          clients={clients}
          onSave={handleSaveAnimal}
          onCancel={handleCloseAnimalDialog}
        />
      </Dialog>
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
              {" "}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Basic Information
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      <strong>Name:</strong> {selectedAnimal.name}
                    </Typography>{" "}
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
                    </Typography>{" "}
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
                      <strong>Tag Number:</strong>{" "}
                      {selectedAnimal.tagNumber || "Not specified"}
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
                    </Typography>{" "}
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
                    <Typography variant="body1" gutterBottom>
                      <strong>Vaccine Manufacturer:</strong>{" "}
                      {selectedAnimal.vaccineManufacturer || "Not specified"}
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
                  Owner Information
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1">
                      <strong>Owner:</strong> {selectedAnimal.clientName}
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
                                  ).toLocaleDateString()} - ${
                                    record.procedure
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
            </Button>{" "}
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
            </Button>{" "}
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
            </Button>{" "}
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
        disableEnforceFocus
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
      {/* Animal Duplicate Confirmation Dialog */}
      <Dialog
        open={duplicateAnimalConfirmDialog.open}
        onClose={() =>
          setDuplicateAnimalConfirmDialog({
            open: false,
            duplicates: [],
            animalData: {},
          })
        }
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Duplicate Animal Detected
          </Typography>

          <Typography variant="body1" sx={{ mb: 2 }}>
            The following information matches existing animals:
          </Typography>

          {duplicateAnimalConfirmDialog.duplicates.map((duplicate, index) => (
            <Box
              key={index}
              sx={{ mb: 2, p: 2, bgcolor: "warning.light", borderRadius: 1 }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Duplicate{" "}
                {duplicate.field === "microchip"
                  ? "Microchip Number"
                  : duplicate.field === "tag"
                  ? "Tag Number"
                  : duplicate.field === "name_client"
                  ? "Name & Client"
                  : duplicate.field.charAt(0).toUpperCase() +
                    duplicate.field.slice(1)}
                : {duplicate.value}
              </Typography>

              {duplicate.matches.map((match: Animal, matchIndex: number) => (
                <Typography key={matchIndex} variant="body2" sx={{ ml: 2 }}>
                  • {match.name} ({match.species})
                  {match.breed && ` - ${match.breed}`}
                  {match.clientName && ` - Owner: ${match.clientName}`}
                </Typography>
              ))}
            </Box>
          ))}

          <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
            Do you want to create this animal anyway?
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => handleAnimalDuplicateConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleAnimalDuplicateConfirmation(true)}
            >
              Create Anyway
            </Button>
          </Box>
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
    </Box>
  );
}

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
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  MedicalServices as MedicalIcon,
} from "@mui/icons-material";
import { Animal, MedicalRecord, Client } from "../../types/models";
import AnimalForm from "./AnimalForm";
import MedicalRecordForm from "./MedicalRecordForm";
import api from "../../utils/api";

interface MongoAnimalResponse {
  _id: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed?: string;
  age?: number;
  gender?: "male" | "female" | "unknown";
  weight: number;
  client?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  medicalHistory: MedicalRecord[];
  notes?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openAnimalDialog, setOpenAnimalDialog] = useState(false);
  const [openMedicalDialog, setOpenMedicalDialog] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
        ? data.map((animal: any) => ({
            ...animal,
            id: animal._id,
            client: animal.client?._id, // Make client reference optional
            weight: animal.weight != null ? parseFloat(animal.weight) : null,
            clientName: animal.client
              ? `${animal.client.firstName} ${animal.client.lastName}`
              : "No Client",
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

  const handleSaveAnimal = async (animalData: Partial<Animal>) => {
    try {
      if (selectedAnimal) {
        const mongoResponse: MongoAnimalResponse = await api.put(
          `/animals/${selectedAnimal.id}`,
          animalData
        );
        const transformedData: Animal = {
          id: mongoResponse._id,
          name: mongoResponse.name,
          species: mongoResponse.species,
          breed: mongoResponse.breed,
          age: mongoResponse.age,
          gender: mongoResponse.gender,
          weight: mongoResponse.weight != null ? mongoResponse.weight : null,
          client: mongoResponse.client?._id,
          clientName: mongoResponse.client
            ? `${mongoResponse.client.firstName} ${mongoResponse.client.lastName}`
            : "No Client",
          medicalHistory: mongoResponse.medicalHistory || [],
          createdAt: new Date(mongoResponse.createdAt),
          updatedAt: new Date(mongoResponse.updatedAt),
        };
        setAnimals((prevAnimals) =>
          prevAnimals.map((animal) =>
            animal.id === selectedAnimal.id ? transformedData : animal
          )
        );
      } else {
        const mongoResponse: MongoAnimalResponse = await api.post(
          "/animals",
          animalData
        );
        const transformedData: Animal = {
          id: mongoResponse._id,
          name: mongoResponse.name,
          species: mongoResponse.species,
          breed: mongoResponse.breed,
          age: mongoResponse.age,
          gender: mongoResponse.gender,
          weight: mongoResponse.weight != null ? mongoResponse.weight : null,
          client: mongoResponse.client?._id,
          clientName: mongoResponse.client
            ? `${mongoResponse.client.firstName} ${mongoResponse.client.lastName}`
            : "No Client",
          medicalHistory: mongoResponse.medicalHistory || [],
          createdAt: new Date(mongoResponse.createdAt),
          updatedAt: new Date(mongoResponse.updatedAt),
        };
        setAnimals((prevAnimals) => [...prevAnimals, transformedData]);
      }
      handleCloseAnimalDialog();
    } catch (err: any) {
      setError(err?.message || "Failed to save animal");
    }
  };

  const handleSaveMedicalRecord = (data: Partial<MedicalRecord>) => {
    // Implement medical record save functionality
    console.log("Save medical record:", data);
    handleCloseMedicalDialog();
  };

  const handleClientChange = (_: any, client: Client | null) => {
    setSelectedClient(client);
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
          color={params.value === "DOG" ? "primary" : "secondary"}
          size="small"
        />
      ),
    },
    { field: "breed", headerName: "Breed", flex: 1 },
    { field: "age", headerName: "Age", width: 100 },
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
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleEditClick(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Medical Record">
            <IconButton
              size="small"
              onClick={() => handleAddMedicalRecord(params.row)}
              color="primary"
            >
              <MedicalIcon />
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

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Animals
        </Typography>
        <Box sx={{ width: 300, mx: 2 }}>
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Add Animal
        </Button>
      </Box>

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
        disableRowSelectionOnClick
        autoHeight
        loading={loading}
      />

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
          onSave={handleSaveMedicalRecord}
          onCancel={handleCloseMedicalDialog}
        />
      </Dialog>
    </Box>
  );
}

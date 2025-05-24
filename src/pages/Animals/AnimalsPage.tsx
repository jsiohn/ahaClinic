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
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  MedicalServices as MedicalIcon,
  Close as CloseIcon,
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
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
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

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedAnimal(null);
  };
  const handleRowClick = (params: any) => {
    // Check if the click target is a button or icon
    const isActionButton = (params.event?.target as HTMLElement)?.closest(
      ".MuiIconButton-root"
    );
    if (!isActionButton) {
      setSelectedAnimal(params.row);
      setOpenDetailDialog(true);
    }
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
  const handleSaveMedicalRecord = async (data: Partial<MedicalRecord>) => {
    try {
      if (!selectedAnimal) return;

      // Save medical record to API
      await api.post(`/animals/${selectedAnimal.id}/medical-records`, data);

      // Refresh animal data to include the new medical record
      await fetchAnimals();

      handleCloseMedicalDialog();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save medical record"
      );
    }
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
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                handleEditClick(params.row);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
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
        disableRowSelectionOnClick={false}
        autoHeight
        loading={loading}
        onRowClick={handleRowClick}
        sx={{
          "& .MuiDataGrid-row": {
            cursor: "pointer",
          },
        }}
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

      {/* Animal Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
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
                    <Typography variant="body1" gutterBottom>
                      <strong>Species:</strong>{" "}
                      <Chip
                        icon={<PetsIcon />}
                        label={selectedAnimal.species}
                        color={
                          selectedAnimal.species === "DOG"
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
                      <strong>Age:</strong> {selectedAnimal.age || "Unknown"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
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
                    <Typography variant="body1">
                      <strong>Weight:</strong>{" "}
                      {selectedAnimal.weight != null
                        ? `${selectedAnimal.weight} lbs`
                        : "Unknown"}
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
                            key={index}
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
                                  >
                                    <strong>Veterinarian:</strong>{" "}
                                    {record.veterinarian}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    <strong>Notes:</strong> {record.notes}
                                  </Typography>
                                </>
                              }
                            />
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
              variant="contained"
              color="primary"
              onClick={handleCloseDetailDialog}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

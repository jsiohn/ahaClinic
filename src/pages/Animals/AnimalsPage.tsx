// @ts-ignore - Suppress false positive unused variable warnings for React components
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
} from "@mui/icons-material";
import { Animal, MedicalRecord, Client } from "../../types/models";
import AnimalForm from "./AnimalForm";
import MedicalRecordForm from "./MedicalRecordForm";
import api from "../../utils/api";
import * as pdfUtils from "../../utils/pdfUtils";

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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentPdfFormTitle, setCurrentPdfFormTitle] =
    useState<string>("PDF Form");

  // Define available PDF forms
  const pdfForms = [
    { file: "clinicIntakeForm.pdf", title: "Intake Form" },
    { file: "clinicDoaReg.pdf", title: "DOA Registration" },
    { file: "clinicRabiesCert.pdf", title: "Rabies Certificate" },
    { file: "clinicTakehomeForm.pdf", title: "Take-home Form" },
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
  const handleViewPdfForm = async (
    animal: Animal,
    formFile: string,
    formTitle: string
  ) => {
    try {
      setPdfLoading(true);
      setCurrentPdfFormTitle(formTitle);

      // Fetch the blank form
      const formResponse = await fetch(`/src/assets/${formFile}`);
      const formArrayBuffer = await formResponse.arrayBuffer();
      const formBytes = new Uint8Array(formArrayBuffer); // Prepare basic form data with animal information
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
            County: "",
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
          </Tooltip>{" "}
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
  };
  const handleClientChange = (_: unknown, newValue: Client | null) => {
    setSelectedClient(newValue);
  };

  const handleSaveAnimal = async (animalData: Partial<Animal>) => {
    try {
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
          },
        ]);
      }
      handleCloseAnimalDialog();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Failed to save animal"
      );
    }
  };

  const handleSaveMedicalRecord = async (
    recordData: Partial<MedicalRecord>
  ) => {
    try {
      if (!selectedAnimal) return;

      const response = await api.post(
        `/animals/${selectedAnimal.id}/medical-records`,
        recordData
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
              }
            : animal
        )
      );

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
                    <Typography variant="body1">
                      <strong>Microchip Number:</strong>{" "}
                      {selectedAnimal.microchipNumber || "Not microchipped"}
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
                    <Typography variant="body1" component="div">
                      <strong>Spayed/Neutered:</strong>{" "}
                      {selectedAnimal.isSpayedNeutered ? (
                        <Chip label="Yes" color="success" size="small" />
                      ) : (
                        <Chip label="No" color="error" size="small" />
                      )}
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
    </Box>
  );
}

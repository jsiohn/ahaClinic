import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../utils/auth";
import api from "../../utils/api";

interface Service {
  name: string;
  price: string;
}

interface ServiceCategory {
  category: string;
  services: Service[];
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<{
    categoryIndex: number;
    serviceIndex: number;
  } | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    type: "category" | "service";
    categoryIndex?: number;
    serviceIndex?: number;
  }>({ open: false, type: "category" });

  // Load services from API
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/services");
      // The api utility already extracts response.data, so response IS the data
      setCategories(Array.isArray(response) ? response : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load services");
      // Set empty array on error to prevent undefined errors
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Save services to API
  const saveServices = async () => {
    try {
      setSaving(true);
      await api.put("/services", { services: categories });
      setSuccess("Services updated successfully!");
      setEditingCategory(null);
      setEditingService(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save services");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const addCategory = () => {
    const newCategory: ServiceCategory = {
      category: "New Category",
      services: [],
    };
    const currentCategories = categories || [];
    setCategories([...currentCategories, newCategory]);
    setEditingCategory(`New Category-${currentCategories.length}`);
  };

  const addService = (categoryIndex: number) => {
    if (!categories || !categories[categoryIndex]) return;

    const newCategories = [...categories];
    newCategories[categoryIndex].services.push({
      name: "New Service",
      price: "$0",
    });
    setCategories(newCategories);
    setEditingService({
      categoryIndex,
      serviceIndex: newCategories[categoryIndex].services.length - 1,
    });
  };

  const updateCategory = (index: number, newName: string) => {
    if (!categories || !categories[index]) return;

    const newCategories = [...categories];
    newCategories[index].category = newName;
    setCategories(newCategories);
  };

  const updateService = (
    categoryIndex: number,
    serviceIndex: number,
    field: "name" | "price",
    value: string
  ) => {
    if (
      !categories ||
      !categories[categoryIndex] ||
      !categories[categoryIndex].services[serviceIndex]
    )
      return;

    const newCategories = [...categories];
    newCategories[categoryIndex].services[serviceIndex][field] = value;
    setCategories(newCategories);
  };

  const deleteCategory = (index: number) => {
    if (!categories) return;

    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
    setDeleteConfirmDialog({ open: false, type: "category" });
  };

  const deleteService = (categoryIndex: number, serviceIndex: number) => {
    if (!categories || !categories[categoryIndex]) return;

    const newCategories = [...categories];
    newCategories[categoryIndex].services = newCategories[
      categoryIndex
    ].services.filter((_, i) => i !== serviceIndex);
    setCategories(newCategories);
    setDeleteConfirmDialog({ open: false, type: "service" });
  };

  const handleDeleteClick = (
    type: "category" | "service",
    categoryIndex: number,
    serviceIndex?: number
  ) => {
    setDeleteConfirmDialog({
      open: true,
      type,
      categoryIndex,
      serviceIndex,
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <Typography>Loading services...</Typography>
      </Box>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_SYSTEM_SETTINGS}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Service Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage clinic services and pricing for invoices
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addCategory}
              disabled={saving}
            >
              Add Category
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveServices}
              disabled={saving || !categories || categories.length === 0}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>

        {!categories || categories.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <SettingsIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No service categories found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first service category to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addCategory}
            >
              Add Category
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {(categories || []).map((category, categoryIndex) => (
              <Grid item xs={12} key={categoryIndex}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        pr: 2,
                      }}
                    >
                      {editingCategory ===
                      `${category.category}-${categoryIndex}` ? (
                        <TextField
                          value={category.category}
                          onChange={(e) =>
                            updateCategory(categoryIndex, e.target.value)
                          }
                          onBlur={() => setEditingCategory(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingCategory(null);
                            }
                          }}
                          size="small"
                          autoFocus
                          sx={{ mr: 2 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{ flexGrow: 1, cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(
                              `${category.category}-${categoryIndex}`
                            );
                          }}
                        >
                          {category.category} ({category.services.length}{" "}
                          services)
                        </Typography>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="subtitle1">
                          Services in {category.category}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => addService(categoryIndex)}
                          >
                            Add Service
                          </Button>
                          <Tooltip title="Delete category">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteClick("category", categoryIndex)
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {category.services.length === 0 ? (
                        <Paper
                          sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            No services in this category
                          </Typography>
                        </Paper>
                      ) : (
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Service Name</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell width="100">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {category.services.map(
                                (service, serviceIndex) => (
                                  <TableRow key={serviceIndex}>
                                    <TableCell>
                                      {editingService?.categoryIndex ===
                                        categoryIndex &&
                                      editingService?.serviceIndex ===
                                        serviceIndex ? (
                                        <TextField
                                          value={service.name}
                                          onChange={(e) =>
                                            updateService(
                                              categoryIndex,
                                              serviceIndex,
                                              "name",
                                              e.target.value
                                            )
                                          }
                                          onBlur={() => setEditingService(null)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              setEditingService(null);
                                            }
                                          }}
                                          size="small"
                                          fullWidth
                                          autoFocus
                                        />
                                      ) : (
                                        <Typography
                                          sx={{ cursor: "pointer" }}
                                          onClick={() =>
                                            setEditingService({
                                              categoryIndex,
                                              serviceIndex,
                                            })
                                          }
                                        >
                                          {service.name}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        value={service.price}
                                        onChange={(e) =>
                                          updateService(
                                            categoryIndex,
                                            serviceIndex,
                                            "price",
                                            e.target.value
                                          )
                                        }
                                        size="small"
                                        sx={{ width: 120 }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                          handleDeleteClick(
                                            "service",
                                            categoryIndex,
                                            serviceIndex
                                          )
                                        }
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Success/Error Messages */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess("")}
        >
          <Alert onClose={() => setSuccess("")} severity="success">
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
        >
          <Alert onClose={() => setError("")} severity="error">
            {error}
          </Alert>
        </Snackbar>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmDialog.open}
          onClose={() =>
            setDeleteConfirmDialog({ ...deleteConfirmDialog, open: false })
          }
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this {deleteConfirmDialog.type}?
              {deleteConfirmDialog.type === "category" &&
                " This will also delete all services in this category."}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setDeleteConfirmDialog({ ...deleteConfirmDialog, open: false })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (
                  deleteConfirmDialog.type === "category" &&
                  deleteConfirmDialog.categoryIndex !== undefined
                ) {
                  deleteCategory(deleteConfirmDialog.categoryIndex);
                } else if (
                  deleteConfirmDialog.type === "service" &&
                  deleteConfirmDialog.categoryIndex !== undefined &&
                  deleteConfirmDialog.serviceIndex !== undefined
                ) {
                  deleteService(
                    deleteConfirmDialog.categoryIndex,
                    deleteConfirmDialog.serviceIndex
                  );
                }
              }}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  );
}

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
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  LocalPrintshop as PrintIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Invoice, InvoiceItem } from "../../types/models";
import InvoiceFormNew from "./InvoiceFormNew";
import api from "../../utils/api";
import {
  generateInvoicePdf,
  createPdfUrl,
  printPdf,
} from "../../utils/pdfUtils";
import { formatDateForDisplay } from "../../utils/dateUtils";
import { PermissionGuard } from "../../components/PermissionGuard";
import { PERMISSIONS } from "../../utils/auth";

// Extended invoice interface for use in this component
interface ExtendedInvoice extends Invoice {
  client?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string; // For organizations
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      county?: string;
    };
  };
  // Override animalSections to include populated animal data
  animalSections: {
    animalId: string;
    animal?: {
      _id?: string;
      id?: string;
      name: string;
      species: string;
    };
    items: InvoiceItem[];
    subtotal: number;
  }[];
  notes?: string;
}

interface ApiInvoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  date: string; // Date comes as string from API
  dueDate: string; // Date comes as string from API
  client?:
    | {
        _id: string;
        id?: string;
        firstName?: string;
        lastName?: string;
        name?: string; // For organizations
        address?: {
          street?: string;
          city?: string;
          state?: string;
          zipCode?: string;
          country?: string;
          county?: string;
        };
      }
    | string;
  animalSections: {
    animalId:
      | {
          _id: string;
          id?: string;
          name: string;
          species: string;
        }
      | string;
    items: {
      description: string;
      procedure: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
    subtotal: number;
  }[];
  subtotal: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "credit_card" | "bank_transfer" | "check" | null;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<ExtendedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [detailAnimals, setDetailAnimals] = useState<any[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formatCurrency = (amount: number | null | undefined) => {
    // Handle null, undefined, or NaN values
    const validAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validAmount);
  };
  const transformInvoiceData = (invoice: ApiInvoice): ExtendedInvoice => {
    // Ensure monetary values are properly converted to numbers
    const subtotal =
      typeof invoice.subtotal === "string"
        ? parseFloat(invoice.subtotal)
        : typeof invoice.subtotal === "number"
        ? invoice.subtotal
        : 0;

    const total =
      typeof invoice.total === "string"
        ? parseFloat(invoice.total)
        : typeof invoice.total === "number"
        ? invoice.total
        : subtotal; // Default total to subtotal when no tax

    // Extract client ID properly with type checking
    let clientId: string = "";
    if (invoice.client) {
      if (typeof invoice.client === "object" && invoice.client !== null) {
        clientId = invoice.client._id || invoice.client.id || "";
      } else if (typeof invoice.client === "string") {
        clientId = invoice.client;
      }
    }

    // Transform animalSections to include populated animal data
    const animalSections = invoice.animalSections.map((section) => {
      let animal:
        | { _id?: string; id?: string; name: string; species: string }
        | undefined;

      if (typeof section.animalId === "object" && section.animalId !== null) {
        // animalId is populated with animal data
        const animalData = section.animalId as any;
        animal = {
          _id: animalData._id || animalData.id || "",
          id: animalData.id || animalData._id || "",
          name: animalData.name || "Unknown",
          species: animalData.species || "Unknown",
        };
      }

      return {
        animalId:
          typeof section.animalId === "string"
            ? section.animalId
            : (section.animalId as any)._id || "",
        animal,
        items: section.items.map((item) => ({
          id: item.description, // Use description as id for now
          procedure: item.procedure,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        subtotal: section.subtotal,
      };
    });

    return {
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      clientId,
      // Preserve the client object for UI display
      client: typeof invoice.client === "object" ? invoice.client : undefined,
      animalSections,
      date: new Date(invoice.date),
      dueDate: new Date(invoice.dueDate),
      paymentMethod: invoice.paymentMethod,
      paymentDate: invoice.paymentDate
        ? new Date(invoice.paymentDate)
        : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt),
      subtotal,
      total,
      status: invoice.status,
      notes: invoice.notes,
    };
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiInvoice[]>("/invoices");
      // response is already the data because of the axios interceptor
      const invoiceData = Array.isArray(response) ? response : [];
      const transformedInvoices = invoiceData.map(transformInvoiceData);
      setInvoices(transformedInvoices);
    } catch (error) {
      setError("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    // Clear any active focus before opening dialog
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }

    setSelectedInvoice(null);
    setOpenDialog(true);
  };
  const handleEditClick = async (invoice: ExtendedInvoice) => {
    try {
      // Clear any active DataGrid focus before opening dialog
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && typeof activeElement.blur === "function") {
        activeElement.blur();
      }

      // Fetch fresh invoice data to ensure we have complete information
      const response = await api.get<ApiInvoice>(`/invoices/${invoice.id}`);
      if (response) {
        const freshInvoice = transformInvoiceData(
          response as unknown as ApiInvoice
        );
        setSelectedInvoice(freshInvoice);
        setOpenDialog(true);
      }
    } catch (error) {
      // Fallback to using the row data if fetch fails
      setSelectedInvoice(invoice);
      setOpenDialog(true);
    }
  };

  const handleDeleteClick = async (invoice: ExtendedInvoice) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        setLoading(true);
        await api.delete(`/invoices/${invoice.id}`);
        setInvoices(invoices.filter((i) => i.id !== invoice.id));
      } catch (error) {
        setError("Failed to delete invoice");
      } finally {
        setLoading(false);
      }
    }
  };
  const handlePrintClick = async (invoice: ExtendedInvoice) => {
    try {
      setLoading(true);

      // Generate PDF from invoice data
      const pdfBytes = await generateInvoicePdf(invoice); // Create a URL for the PDF
      const url = createPdfUrl(pdfBytes);

      // Print the PDF
      printPdf(url);

      // Clean up the URL after printing
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (error) {
      setError(
        `Failed to generate or print invoice: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
  };
  const handleRowClick = async (params: any) => {
    // Check if the click target is a button or icon
    const isActionButton = (params.event?.target as HTMLElement)?.closest(
      ".MuiIconButton-root"
    );
    if (!isActionButton) {
      // Clear any active DataGrid focus before opening dialog
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && typeof activeElement.blur === "function") {
        activeElement.blur();
      }

      setSelectedInvoice(params.row);

      // Fetch animal details for the invoice
      try {
        if (params.row.animalSections && params.row.animalSections.length > 0) {
          const animalIds = params.row.animalSections.map((section: any) => {
            // Handle both populated objects and string IDs
            if (typeof section.animalId === "object" && section.animalId) {
              return section.animalId._id || section.animalId.id;
            }
            return section.animalId;
          });

          const animalResponse = await api.get("/animals");

          const allAnimals = Array.isArray(animalResponse)
            ? animalResponse
            : [];

          const invoiceAnimals = allAnimals.filter((animal: any) =>
            animalIds.includes(animal._id || animal.id)
          );

          setDetailAnimals(invoiceAnimals);
        }
      } catch (error) {
        console.error("Failed to fetch animal details:", error);
        setDetailAnimals([]);
      }

      setOpenDetailDialog(true);
    }
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedInvoice(null);
  };
  const handleSaveInvoice = async (invoiceData: Partial<ExtendedInvoice>) => {
    try {
      if (selectedInvoice) {
        await api.put(`/invoices/${selectedInvoice.id}`, invoiceData);
      } else {
        await api.post("/invoices", invoiceData);
      } // Refresh the invoice list to get the latest data
      await fetchInvoices();
      handleCloseDialog();
    } catch (error: any) {
      const message =
        error.message || error.errors?.[0]?.msg || "Failed to save invoice";
      setError(message);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchTerm.trim()) return true;

    const searchStr = searchTerm.toLowerCase().trim();
    const invoiceNumber = (invoice.invoiceNumber || "").toLowerCase();

    // Get client name from the row data that has been transformed
    const clientName =
      invoice.client?.firstName && invoice.client?.lastName
        ? `${invoice.client.firstName} ${invoice.client.lastName}`.toLowerCase()
        : "";

    // Get animal names from the animalSections
    const animalNames = invoice.animalSections
      .map((section) => section.animal?.name?.toLowerCase() || "")
      .filter((name) => name)
      .join(" ");

    const status = (invoice.status || "").toLowerCase();
    const total = invoice.total?.toString() || "";

    return (
      invoiceNumber.includes(searchStr) ||
      clientName.includes(searchStr) ||
      animalNames.includes(searchStr) ||
      status.includes(searchStr) ||
      total.includes(searchStr)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "draft":
      case "sent":
        return "info";
      case "overdue":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "date",
      headerName: "Date",
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        if (params.row.date) {
          return <span>{formatDateForDisplay(params.row.date)}</span>;
        }
        return <span></span>;
      },
    },
    {
      field: "invoiceNumber",
      headerName: "Invoice #",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReceiptIcon fontSize="small" />
          {params.value}
        </Box>
      ),
    },
    {
      field: "client",
      headerName: "Client",
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const clientName =
          params.row.client?.firstName && params.row.client?.lastName
            ? `${params.row.client.firstName} ${params.row.client.lastName}`
            : params.row.client?.name || "Unknown Client";
        return <span>{clientName}</span>;
      },
    },
    {
      field: "animals",
      headerName: "Animals",
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const animalNames = params.row.animalSections
          ? params.row.animalSections
              .map((section: any) => section.animal?.name)
              .filter((name: string) => name)
              .join(", ")
          : "No Animals";
        return <span>{animalNames}</span>;
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: "subtotal",
      headerName: "Subtotal",
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const value = Number(params.row.subtotal || 0);
        return <span>{formatCurrency(value)}</span>;
      },
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const value = Number(params.row.total || 0);
        return <span>{formatCurrency(value)}</span>;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <PermissionGuard permission={PERMISSIONS.UPDATE_INVOICES}>
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
          </PermissionGuard>
          <Tooltip title="Print">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handlePrintClick(params.row);
              }}
              color="primary"
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <PermissionGuard permission={PERMISSIONS.DELETE_INVOICES}>
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
          </PermissionGuard>
        </Box>
      ),
    },
  ];
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
        <Typography variant="h4" component="h1">
          Invoices
        </Typography>{" "}
        <TextField
          variant="outlined"
          placeholder="Search Invoices..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            width: { xs: "100%", sm: 300 },
            maxWidth: 300,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />{" "}
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <PermissionGuard permission={PERMISSIONS.CREATE_INVOICES}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Create Invoice
            </Button>
          </PermissionGuard>
        </Box>
      </Box>{" "}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ flex: 1, width: "100%", minHeight: 0 }}>
        <DataGrid
          rows={
            Array.isArray(filteredInvoices)
              ? filteredInvoices.map((invoice) => ({
                  ...invoice,
                  // Explicitly convert monetary values to numbers to ensure they're correctly displayed
                  subtotal: Number(invoice.subtotal || 0),
                  total: Number(invoice.total || 0),
                }))
              : []
          }
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
            sorting: {
              sortModel: [{ field: "date", sort: "desc" }],
            },
          }}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection={false}
          disableRowSelectionOnClick={false}
          getRowId={(row) => row.id || row._id}
          onRowClick={handleRowClick}
          sx={{
            "& .MuiDataGrid-row": {
              cursor: "pointer",
            },
            height: "100%",
            minWidth: 0,
            width: "100%",
          }}
          loading={loading}
        />
      </Box>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        aria-labelledby="invoice-dialog-title"
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus={false}
      >
        <InvoiceFormNew
          invoice={selectedInvoice}
          onSave={handleSaveInvoice}
          onCancel={handleCloseDialog}
        />
      </Dialog>
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus={false}
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
              Invoice Details
            </Typography>
            <IconButton onClick={handleCloseDetailDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3 }} />
          {selectedInvoice && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Invoice Information
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      <strong>Invoice #:</strong>{" "}
                      {selectedInvoice.invoiceNumber}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Date:</strong>{" "}
                      {formatDateForDisplay(selectedInvoice.date)}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Due Date:</strong>{" "}
                      {formatDateForDisplay(selectedInvoice.dueDate)}
                    </Typography>{" "}
                    <Typography variant="body1" gutterBottom component="div">
                      <strong>Status:</strong>{" "}
                      <Chip
                        label={selectedInvoice.status}
                        color={getStatusColor(selectedInvoice.status)}
                        size="small"
                      />
                    </Typography>
                    {selectedInvoice.paymentDate && (
                      <Typography variant="body1" gutterBottom>
                        <strong>Payment Date:</strong>{" "}
                        {formatDateForDisplay(selectedInvoice.paymentDate)}
                      </Typography>
                    )}
                    {selectedInvoice.paymentMethod && (
                      <Typography variant="body1">
                        <strong>Payment Method:</strong>{" "}
                        {selectedInvoice.paymentMethod
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Client & Animals
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      <strong>Client:</strong>{" "}
                      {selectedInvoice.client?.firstName &&
                      selectedInvoice.client?.lastName
                        ? `${selectedInvoice.client.firstName} ${selectedInvoice.client.lastName}`
                        : selectedInvoice.client?.name || "Unknown Client"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Animals:</strong>{" "}
                      {selectedInvoice.animalSections &&
                      selectedInvoice.animalSections.length > 0
                        ? selectedInvoice.animalSections
                            .map((section) => section.animal?.name)
                            .filter((name) => name)
                            .join(", ")
                        : "No animals"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Financial Details
                </Typography>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      <strong>Subtotal:</strong>{" "}
                      {formatCurrency(selectedInvoice.subtotal)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Total:</strong>{" "}
                      {formatCurrency(selectedInvoice.total)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Animal Services
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    {selectedInvoice.animalSections &&
                    selectedInvoice.animalSections.length > 0 ? (
                      <Box>
                        {selectedInvoice.animalSections.map(
                          (section, sectionIndex) => {
                            // First try to use the animal data if it's already populated in the section
                            let animal = null;
                            if (
                              typeof section.animalId === "object" &&
                              section.animalId
                            ) {
                              animal = section.animalId; // Use the populated animal data directly
                            } else {
                              // Fall back to looking it up in detailAnimals
                              animal = detailAnimals.find(
                                (a) =>
                                  a.id === section.animalId ||
                                  a._id === section.animalId
                              );
                            }

                            return (
                              <Box
                                key={`animal-section-${section.animalId}-${sectionIndex}`}
                                sx={{
                                  mb: 3,
                                  p: 2,
                                  border: "2px solid #e0e0e0",
                                  borderRadius: 1,
                                  backgroundColor: "#f9f9f9",
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  gutterBottom
                                  sx={{ color: "primary.main" }}
                                >
                                  {animal
                                    ? `${animal.name} (${animal.species})`
                                    : "Unknown Animal"}
                                </Typography>

                                {section.items && section.items.length > 0 ? (
                                  section.items.map((item, itemIndex) => (
                                    <Box
                                      key={`item-${
                                        section.animalId
                                      }-${itemIndex}-${
                                        typeof item.id === "string"
                                          ? item.id
                                          : itemIndex
                                      }`}
                                      sx={{
                                        mb: 1,
                                        p: 1.5,
                                        border: "1px solid #d0d0d0",
                                        borderRadius: 1,
                                        backgroundColor: "white",
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                      >
                                        {item.procedure}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        gutterBottom
                                      >
                                        {item.description}
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          mt: 1,
                                        }}
                                      >
                                        <Typography variant="body2">
                                          <strong>Quantity:</strong>{" "}
                                          {item.quantity}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Unit Price:</strong> $
                                          {Number(item.unitPrice).toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Total:</strong> $
                                          {Number(item.total).toFixed(2)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  ))
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    No items for this animal
                                  </Typography>
                                )}

                                <Box sx={{ mt: 2, textAlign: "right" }}>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                  >
                                    Animal Subtotal: $
                                    {Number(section.subtotal).toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          }
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body1">
                        No animal services in this invoice
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 3,
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                handleCloseDetailDialog();
                handleEditClick(selectedInvoice!);
              }}
              startIcon={<EditIcon />}
            >
              Edit Invoice
            </Button>{" "}
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                handleCloseDetailDialog();
                handlePrintClick(selectedInvoice!);
              }}
              startIcon={<PrintIcon />}
            >
              Print Invoice
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseDetailDialog}
            >
              Close
            </Button>
          </Box>{" "}
        </Box>
      </Dialog>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

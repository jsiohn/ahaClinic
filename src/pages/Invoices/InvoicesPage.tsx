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
import { Invoice } from "../../types/models";
import InvoiceForm from "./InvoiceForm";
import api from "../../utils/api";
import {
  generateInvoicePdf,
  createPdfUrl,
  printPdf,
} from "../../utils/pdfUtils";

// Extended invoice interface for use in this component
interface ExtendedInvoice extends Invoice {
  client?: {
    _id?: string;
    id?: string;
    firstName: string;
    lastName: string;
  };
  animal?: {
    _id?: string;
    id?: string;
    name: string;
    species: string;
  };
}

interface ApiInvoice extends Omit<Invoice, "id"> {
  _id: string;
  client?:
    | {
        _id: string;
        id?: string;
        firstName: string;
        lastName: string;
      }
    | string;
  animal?:
    | {
        _id: string;
        id?: string;
        name: string;
        species: string;
      }
    | string;
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

    // Extract client and animal IDs properly with type checking
    let clientId: string = "";
    if (invoice.client) {
      if (typeof invoice.client === "object" && invoice.client !== null) {
        clientId = invoice.client._id || invoice.client.id || "";
      } else if (typeof invoice.client === "string") {
        clientId = invoice.client;
      }
    }

    let animalId: string = "";
    if (invoice.animal) {
      if (typeof invoice.animal === "object" && invoice.animal !== null) {
        animalId = invoice.animal._id || invoice.animal.id || "";
      } else if (typeof invoice.animal === "string") {
        animalId = invoice.animal;
      }
    }
    return {
      ...invoice,
      id: invoice._id,
      // Make sure we set the clientId and animalId correctly
      clientId,
      animalId,
      // Preserve the client and animal objects for UI display
      client: typeof invoice.client === "object" ? invoice.client : undefined,
      animal: typeof invoice.animal === "object" ? invoice.animal : undefined,
      date: new Date(invoice.date),
      dueDate: new Date(invoice.dueDate),
      paymentDate: invoice.paymentDate
        ? new Date(invoice.paymentDate)
        : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt),
      subtotal,
      total,
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Math.max(1, parseInt(String(item.quantity || 1))),
        unitPrice:
          typeof item.unitPrice === "string"
            ? parseFloat(item.unitPrice)
            : typeof item.unitPrice === "number"
            ? item.unitPrice
            : 0,
        total:
          typeof item.total === "string"
            ? parseFloat(item.total)
            : typeof item.total === "number"
            ? item.total
            : 0,
      })),
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
    setSelectedInvoice(null);
    setOpenDialog(true);
  };
  const handleEditClick = async (invoice: ExtendedInvoice) => {
    try {
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
  const handleRowClick = (params: any) => {
    // Check if the click target is a button or icon
    const isActionButton = (params.event?.target as HTMLElement)?.closest(
      ".MuiIconButton-root"
    );
    if (!isActionButton) {
      setSelectedInvoice(params.row);
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

    // Get animal name from the row data that has been transformed
    const animalName = invoice.animal?.name
      ? invoice.animal.name.toLowerCase()
      : "";

    const status = (invoice.status || "").toLowerCase();
    const total = invoice.total?.toString() || "";

    return (
      invoiceNumber.includes(searchStr) ||
      clientName.includes(searchStr) ||
      animalName.includes(searchStr) ||
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
          return <span>{new Date(params.row.date).toLocaleDateString()}</span>;
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
            : "Unknown Client";
        return <span>{clientName}</span>;
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Create Invoice
          </Button>
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
      >
        <InvoiceForm
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
                      {new Date(selectedInvoice.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Due Date:</strong>{" "}
                      {new Date(selectedInvoice.dueDate).toLocaleDateString()}
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
                      <Typography variant="body1">
                        <strong>Payment Date:</strong>{" "}
                        {new Date(
                          selectedInvoice.paymentDate
                        ).toLocaleDateString()}
                      </Typography>
                    )}
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
                  Invoice Items
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    {selectedInvoice.items &&
                    selectedInvoice.items.length > 0 ? (
                      <Box>
                        {selectedInvoice.items.map((item, index) => (
                          <Box
                            key={item.id || index}
                            sx={{
                              mb: 2,
                              p: 2,
                              border: "1px solid #e0e0e0",
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="subtitle2" gutterBottom>
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
                                <strong>Quantity:</strong> {item.quantity}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Unit Price:</strong>{" "}
                                {formatCurrency(item.unitPrice)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Total:</strong>{" "}
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body1">
                        No items in this invoice
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

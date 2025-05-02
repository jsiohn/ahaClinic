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
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  LocalPrintshop as PrintIcon,
} from "@mui/icons-material";
import { Invoice } from "../../types/models";
import InvoiceForm from "./InvoiceForm";
import api from "../../utils/api";

interface ApiInvoice extends Omit<Invoice, "id"> {
  _id: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const transformInvoiceData = (invoice: ApiInvoice): Invoice => ({
    ...invoice,
    id: invoice._id,
    date: new Date(invoice.date),
    dueDate: new Date(invoice.dueDate),
    paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate) : undefined,
    createdAt: new Date(invoice.createdAt),
    updatedAt: new Date(invoice.updatedAt),
    subtotal: typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : Number(invoice.subtotal || 0),
    tax: typeof invoice.tax === 'string' ? parseFloat(invoice.tax) : Number(invoice.tax || 0),
    total: typeof invoice.total === 'string' ? parseFloat(invoice.total) : Number(invoice.total || 0),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Math.max(1, parseInt(String(item.quantity || 1))),
      unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : Number(item.unitPrice || 0),
      total: typeof item.total === 'string' ? parseFloat(item.total) : Number(item.total || 0)
    }))
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiInvoice[]>("/invoices");
      console.log("Raw API response:", response);
      // response is already the data because of the axios interceptor
      const invoiceData = Array.isArray(response) ? response : [];
      console.log(
        "Transformed invoices:",
        invoiceData.map(transformInvoiceData)
      );
      setInvoices(invoiceData.map(transformInvoiceData));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setSelectedInvoice(null);
    setOpenDialog(true);
  };

  const handleEditClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
  };

  const handleDeleteClick = async (invoice: Invoice) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.delete(`/invoices/${invoice.id}`);
        setInvoices(invoices.filter((i) => i.id !== invoice.id));
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
    }
  };

  const handlePrintClick = (invoice: Invoice) => {
    // Store the invoice data for printing
    console.log("Preparing to print invoice:", invoice);
    window.print();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
  };

  const handleSaveInvoice = async (invoiceData: Partial<Invoice>) => {
    try {
      if (selectedInvoice) {
        await api.put(`/invoices/${selectedInvoice.id}`, invoiceData);
      } else {
        await api.post("/invoices", invoiceData);
      }

      // Refresh the invoice list to get the latest data
      await fetchInvoices();
      handleCloseDialog();
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      const message =
        error.message || error.errors?.[0]?.msg || "Failed to save invoice";
      setError(message);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

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
      valueFormatter: (params: { value: any }) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString();
        }
        return "";
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
      type: "number",
      valueFormatter: (params: { value: number | string }) => {
        const value =
          typeof params.value === "string"
            ? parseFloat(params.value)
            : params.value;
        return formatCurrency(value);
      },
    },
    {
      field: "tax",
      headerName: "Tax",
      width: 120,
      type: "number",
      valueFormatter: (params: { value: number | string }) => {
        const value =
          typeof params.value === "string"
            ? parseFloat(params.value)
            : params.value;
        return formatCurrency(value);
      },
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      type: "number",
      valueFormatter: (params: { value: number | string }) => {
        const value =
          typeof params.value === "string"
            ? parseFloat(params.value)
            : params.value;
        return formatCurrency(value);
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
              onClick={() => handleEditClick(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton
              size="small"
              onClick={() => handlePrintClick(params.row)}
              color="primary"
            >
              <PrintIcon />
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" component="h1">
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Create Invoice
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataGrid
        rows={Array.isArray(invoices) ? invoices : []}
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
        disableRowSelectionOnClick
        getRowId={(row) => row.id || row._id}
        sx={{ minHeight: 400 }}
        loading={loading}
      />

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

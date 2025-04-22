import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Tooltip,
  Chip,
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

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiInvoice[]>("/invoices");
      // Handle both array and object response formats
      const invoicesData = Array.isArray(response)
        ? response
        : response.data || [];
      setInvoices(
        invoicesData.map((invoice) => ({
          ...invoice,
          id: invoice._id,
          date: new Date(invoice.date),
          paymentDate: invoice.paymentDate
            ? new Date(invoice.paymentDate)
            : undefined,
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt),
        }))
      );
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
      let savedInvoice: ApiInvoice;
      if (selectedInvoice) {
        const { data } = await api.put<ApiInvoice>(
          `/invoices/${selectedInvoice.id}`,
          invoiceData
        );
        savedInvoice = data;
      } else {
        const { data } = await api.post<ApiInvoice>("/invoices", invoiceData);
        savedInvoice = data;
      }

      const transformedInvoice: Invoice = {
        ...savedInvoice,
        id: savedInvoice._id,
        date: new Date(savedInvoice.date),
        paymentDate: savedInvoice.paymentDate
          ? new Date(savedInvoice.paymentDate)
          : undefined,
        createdAt: new Date(savedInvoice.createdAt),
        updatedAt: new Date(savedInvoice.updatedAt),
      } as Invoice;

      if (selectedInvoice) {
        setInvoices(
          invoices.map((invoice) =>
            invoice.id === selectedInvoice.id ? transformedInvoice : invoice
          )
        );
      } else {
        setInvoices([...invoices, transformedInvoice]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving invoice:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
      field: "id",
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
      valueFormatter: (params: { value: any }) =>
        formatCurrency(Number(params.value)),
    },
    {
      field: "tax",
      headerName: "Tax",
      width: 120,
      valueFormatter: (params: { value: any }) =>
        formatCurrency(Number(params.value)),
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      valueFormatter: (params: { value: any }) =>
        formatCurrency(Number(params.value)),
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

      <DataGrid
        rows={invoices}
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
        autoHeight
        loading={loading}
      />

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <InvoiceForm
          invoice={selectedInvoice}
          onSave={handleSaveInvoice}
          onCancel={handleCloseDialog}
        />
      </Dialog>
    </Box>
  );
}

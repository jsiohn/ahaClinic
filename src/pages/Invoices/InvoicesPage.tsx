import { useState } from "react";
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

// Temporary mock data - replace with actual API call later
const mockInvoices: Invoice[] = [
  {
    id: "1",
    clientId: "1",
    animalId: "1",
    date: new Date("2024-03-14"),
    procedures: [
      {
        id: "1",
        invoiceId: "1",
        procedure: "Spay Surgery",
        description: "Standard spay procedure",
        quantity: 1,
        unitPrice: 150.0,
        total: 150.0,
      },
    ],
    subtotal: 150.0,
    tax: 12.0,
    total: 162.0,
    status: "PENDING",
    createdAt: new Date("2024-03-14"),
    updatedAt: new Date("2024-03-14"),
  },
];

export default function InvoicesPage() {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleCreateClick = () => {
    setSelectedInvoice(null);
    setOpenDialog(true);
  };

  const handleEditClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    // Implement delete functionality
    console.log("Delete invoice:", invoice);
  };

  const handlePrintClick = (invoice: Invoice) => {
    // Implement print functionality
    console.log("Print invoice:", invoice);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
  };

  const handleSaveInvoice = (invoiceData: Partial<Invoice>) => {
    // Implement save functionality
    console.log("Save invoice:", invoiceData);
    handleCloseDialog();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELLED":
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
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
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
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: "subtotal",
      headerName: "Subtotal",
      width: 120,
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: "tax",
      headerName: "Tax",
      width: 120,
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      valueFormatter: (value: number) => formatCurrency(value),
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

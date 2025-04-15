import { useState } from "react";
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Invoice, InvoiceItem } from "../../types/models";

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSave: (data: Partial<Invoice>) => void;
  onCancel: () => void;
}

interface InvoiceFormData {
  clientId: string;
  animalId: string;
  date: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod?: string;
  paymentDate?: string;
}

const schema = yup.object().shape({
  clientId: yup.string().required("Client is required"),
  animalId: yup.string().required("Animal is required"),
  date: yup.string().required("Date is required"),
  status: yup
    .string()
    .oneOf(["PENDING", "PAID", "CANCELLED"])
    .required("Status is required"),
  paymentMethod: yup.string().when("status", {
    is: "PAID",
    then: (schema) => schema.required("Payment method is required"),
    otherwise: (schema) => schema.optional(),
  }),
  paymentDate: yup.string().when("status", {
    is: "PAID",
    then: (schema) => schema.required("Payment date is required"),
    otherwise: (schema) => schema.optional(),
  }),
});

const defaultProcedures = [
  { id: "spay", name: "Spay Surgery", price: 150.0 },
  { id: "neuter", name: "Neuter Surgery", price: 120.0 },
  { id: "vaccine", name: "Vaccination", price: 45.0 },
  { id: "checkup", name: "Check-up", price: 50.0 },
];

export default function InvoiceForm({
  invoice,
  onSave,
  onCancel,
}: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.procedures || []);
  const taxRate = 0.08; // 8% tax rate

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      clientId: invoice?.clientId || "",
      animalId: invoice?.animalId || "",
      date:
        invoice?.date.toISOString().split("T")[0] ||
        new Date().toISOString().split("T")[0],
      status: invoice?.status || "PENDING",
      paymentMethod: invoice?.paymentMethod,
      paymentDate: invoice?.paymentDate?.toISOString().split("T")[0],
    },
  });

  const status = watch("status");

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `temp-${items.length + 1}`,
      invoiceId: invoice?.id || "",
      procedure: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    // If changing procedure, update unit price and description
    if (field === "procedure") {
      const defaultProcedure = defaultProcedures.find((p) => p.name === value);
      if (defaultProcedure) {
        item.unitPrice = defaultProcedure.price;
        item.description = `Standard ${value}`;
      }
    }

    // Recalculate total
    if (field === "quantity" || field === "unitPrice") {
      item.total = item.quantity * item.unitPrice;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const onSubmit = (data: InvoiceFormData) => {
    const { subtotal, tax, total } = calculateTotals();
    onSave({
      ...data,
      procedures: items,
      subtotal,
      tax,
      total,
      date: new Date(data.date),
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <>
      <DialogTitle>
        {invoice ? "Edit Invoice" : "Create New Invoice"}
      </DialogTitle>
      <DialogContent>
        <Box component="form" noValidate sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Client ID"
                    fullWidth
                    error={!!errors.clientId}
                    helperText={errors.clientId?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="animalId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Animal ID"
                    fullWidth
                    error={!!errors.animalId}
                    helperText={errors.animalId?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Invoice Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!errors.status}>
                <InputLabel>Status</InputLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Status">
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="PAID">Paid</MenuItem>
                      <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            {status === "PAID" && (
              <>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth error={!!errors.paymentMethod}>
                    <InputLabel>Payment Method</InputLabel>
                    <Controller
                      name="paymentMethod"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} label="Payment Method">
                          <MenuItem value="CASH">Cash</MenuItem>
                          <MenuItem value="CREDIT">Credit Card</MenuItem>
                          <MenuItem value="DEBIT">Debit Card</MenuItem>
                          <MenuItem value="CHECK">Check</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="paymentDate"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Payment Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{
                          shrink: true,
                        }}
                        error={!!errors.paymentDate}
                        helperText={errors.paymentDate?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Box
            sx={{
              mt: 4,
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Items</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              variant="outlined"
            >
              Add Item
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Procedure</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          value={item.procedure}
                          onChange={(e) =>
                            handleItemChange(index, "procedure", e.target.value)
                          }
                        >
                          {defaultProcedures.map((proc) => (
                            <MenuItem key={proc.id} value={proc.name}>
                              {proc.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        inputProps={{ min: 1, style: { textAlign: "right" } }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        inputProps={{
                          min: 0,
                          step: 0.01,
                          style: { textAlign: "right" },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveItem(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} align="right">
                    <Typography variant="subtitle1">Subtotal</Typography>
                  </TableCell>
                  <TableCell align="right" colSpan={2}>
                    <Typography variant="subtitle1">
                      {formatCurrency(subtotal)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} align="right">
                    <Typography variant="subtitle1">
                      Tax ({(taxRate * 100).toFixed(0)}%)
                    </Typography>
                  </TableCell>
                  <TableCell align="right" colSpan={2}>
                    <Typography variant="subtitle1">
                      {formatCurrency(tax)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} align="right">
                    <Typography variant="h6">Total</Typography>
                  </TableCell>
                  <TableCell align="right" colSpan={2}>
                    <Typography variant="h6">
                      {formatCurrency(total)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">
          {invoice ? "Save Changes" : "Create Invoice"}
        </Button>
      </DialogActions>
    </>
  );
}

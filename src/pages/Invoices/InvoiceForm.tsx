import { useState, useEffect } from "react";
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
  Autocomplete,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Invoice, InvoiceItem, Client, Animal } from "../../types/models";
import api from "../../utils/api";

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSave: (data: Partial<Invoice>) => void;
  onCancel: () => void;
}

interface InvoiceFormData {
  clientId: string;
  animalId: string;
  date: string;
  dueDate: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "credit_card" | "bank_transfer" | "check" | null;
  paymentDate?: string | null;
}

const schema = yup.object().shape({
  clientId: yup.string().required("Client is required"),
  animalId: yup.string().required("Animal is required"),
  date: yup.string().required("Date is required"),
  dueDate: yup.string().required("Due date is required"),
  invoiceNumber: yup
    .string()
    .required("Invoice number is required")
    .matches(
      /^[A-Z0-9-]+$/,
      "Invoice number can only contain uppercase letters, numbers, and hyphens"
    ),
  status: yup
    .string()
    .oneOf(["draft", "sent", "paid", "overdue", "cancelled"] as const)
    .required("Status is required"),
  paymentMethod: yup
    .string()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .oneOf(["cash", "credit_card", "bank_transfer", "check", null])
    .when("status", {
      is: "paid",
      then: (schema) =>
        schema
          .required("Payment method is required")
          .oneOf(["cash", "credit_card", "bank_transfer", "check"]),
      otherwise: (schema) => schema.nullable().default(null),
    }),
  paymentDate: yup
    .string()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .when("status", {
      is: "paid",
      then: (schema) => schema.required("Payment date is required"),
      otherwise: (schema) => schema.nullable().default(null),
    }),
});

const defaultProcedures = [
  { id: "spay", name: "Spay Surgery", price: 150.0 },
  { id: "neuter", name: "Neuter Surgery", price: 120.0 },
  { id: "vaccine", name: "Vaccination", price: 45.0 },
  { id: "checkup", name: "Check-up", price: 50.0 },
];

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `INV-${year}${month}-${random}`;
};

export default function InvoiceForm({
  invoice,
  onSave,
  onCancel,
}: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.map((item) => ({
      ...item,
      quantity: Math.max(1, parseInt(String(item.quantity)) || 1),
      unitPrice: parseFloat(Number(item.unitPrice || 0).toFixed(2)),
      total: parseFloat(Number(item.total || 0).toFixed(2)),
    })) || []
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const taxRate = 0.08; // 8% tax rate

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      clientId: invoice?.clientId || "",
      animalId: invoice?.animalId || "",
      date:
        invoice?.date.toISOString().split("T")[0] ||
        new Date().toISOString().split("T")[0],
      dueDate:
        invoice?.dueDate?.toISOString().split("T")[0] ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 30 days from now
      invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
      status: invoice?.status || "draft",
      paymentMethod: invoice?.paymentMethod || null,
      paymentDate: invoice?.paymentDate?.toISOString().split("T")[0],
    },
  });

  // Add a debug effect to track state changes
  useEffect(() => {
    if (invoice) {
      console.log("Debug - Current state:");
      console.log("Invoice being edited:", invoice);
      console.log("Selected client:", selectedClient);
      console.log("Selected animal:", selectedAnimal);
      console.log("Client ID:", invoice.clientId);
      console.log("Animal ID:", invoice.animalId);
    }
  }, [invoice, selectedClient, selectedAnimal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients first
        const clientResponse = await api.get("/clients");
        const transformedClients = Array.isArray(clientResponse)
          ? clientResponse.map((client: any) => ({
              ...client,
              id: client._id || client.id,
            }))
          : [];
        setClients(transformedClients);

        // Fetch animals
        const animalResponse = await api.get("/animals");
        const transformedAnimals = Array.isArray(animalResponse)
          ? animalResponse.map((animal: any) => ({
              ...animal,
              id: animal._id || animal.id,
              client:
                typeof animal.client === "object"
                  ? animal.client._id || animal.client.id
                  : animal.client,
            }))
          : [];
        setAnimals(transformedAnimals);

        // If we have an invoice being edited, set the client and animal
        if (invoice) {
          // Find matching client
          const matchingClient = transformedClients.find(
            (c) => c.id === invoice.clientId || c._id === invoice.clientId
          );

          if (matchingClient) {
            console.log("Found matching client:", matchingClient);
            setSelectedClient(matchingClient);
            setValue("clientId", matchingClient.id);
          }

          // Find matching animal
          const matchingAnimal = transformedAnimals.find(
            (a) => a.id === invoice.animalId || a._id === invoice.animalId
          );

          if (matchingAnimal) {
            console.log("Found matching animal:", matchingAnimal);
            setSelectedAnimal(matchingAnimal);
            setValue("animalId", matchingAnimal.id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, [invoice, setValue]);

  // Filter animals based on selected client
  const filteredAnimals = selectedClient
    ? animals.filter((animal) => animal.client === selectedClient.id)
    : animals;

  const getClientOptionLabel = (option: Client | null) => {
    if (!option) return "";
    return `${option.firstName} ${option.lastName}`;
  };

  const getAnimalOptionLabel = (option: Animal | null) => {
    if (!option) return "";
    return `${option.name} (${option.species})`;
  };

  const handleClientChange = (client: Client | null) => {
    setSelectedClient(client);
    setValue("clientId", client?.id || "");
    // Reset animal selection when client changes
    setValue("animalId", "");
    setSelectedAnimal(null);
  };

  const handleAnimalChange = (animal: Animal | null) => {
    setSelectedAnimal(animal);
    setValue("animalId", animal?.id || "");
  };

  const status = watch("status");

  const calculateTotals = () => {
    const subtotal = parseFloat(
      items
        .reduce((sum, item) => {
          const itemTotal = parseFloat(
            (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)
          );
          return parseFloat((sum + itemTotal).toFixed(2));
        }, 0)
        .toFixed(2)
    );

    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    return {
      subtotal,
      tax,
      total,
    };
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
    value: string | number
  ) => {
    const newItems = [...items];
    const item = newItems[index];
    if (item) {
      const updatedItem = { ...item, [field]: value };

      // If procedure changes, update the unit price
      if (field === "procedure") {
        const selectedProcedure = defaultProcedures.find(
          (p) => p.name === value
        );
        if (selectedProcedure) {
          updatedItem.unitPrice = selectedProcedure.price;
        }
      }

      // Recalculate total whenever quantity or unitPrice changes
      if (
        field === "quantity" ||
        field === "unitPrice" ||
        field === "procedure"
      ) {
        updatedItem.total = parseFloat(
          (
            Number(updatedItem.quantity) * Number(updatedItem.unitPrice)
          ).toFixed(2)
        );
      }

      newItems[index] = updatedItem;
      setItems(newItems);
    }
  };

  const onSubmit = (data: InvoiceFormData) => {
    const { subtotal, tax, total } = calculateTotals();

    // Create a base invoice object first
    const invoiceBase = {
      client: data.clientId,
      animal: data.animalId,
      invoiceNumber: data.invoiceNumber,
      date: new Date(data.date),
      dueDate: new Date(data.dueDate),
      status: data.status,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      items: items.map((item) => ({
        description: item.description,
        procedure: item.procedure,
        quantity: Number(item.quantity),
        unitPrice: parseFloat(Number(item.unitPrice).toFixed(2)),
        total: parseFloat(
          (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)
        ),
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };

    onSave(invoiceBase as unknown as Partial<Invoice>);
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
      <DialogTitle id="invoice-dialog-title">
        {invoice ? "Edit Invoice" : "Create New Invoice"}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          noValidate
          sx={{ mt: 2 }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="clientId"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Autocomplete
                    {...field}
                    options={clients}
                    value={selectedClient}
                    getOptionLabel={getClientOptionLabel}
                    onChange={(_, value) => handleClientChange(value)}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                    // Disable if editing an existing invoice
                    disabled={!!invoice}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Client"
                        fullWidth
                        error={!!errors.clientId}
                        helperText={
                          errors.clientId?.message ||
                          (invoice
                            ? "Client cannot be changed after invoice creation"
                            : "")
                        }
                        inputProps={{
                          ...params.inputProps,
                          "aria-label": "Client selection",
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="animalId"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Autocomplete
                    {...field}
                    options={filteredAnimals}
                    value={selectedAnimal}
                    getOptionLabel={getAnimalOptionLabel}
                    onChange={(_, value) => handleAnimalChange(value)}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                    // Disable if editing an existing invoice or if no client is selected
                    disabled={!!invoice || !selectedClient}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Animal"
                        fullWidth
                        error={!!errors.animalId}
                        helperText={
                          invoice
                            ? "Animal cannot be changed after invoice creation"
                            : selectedClient
                            ? errors.animalId?.message
                            : "Please select a client first"
                        }
                        inputProps={{
                          ...params.inputProps,
                          "aria-label": "Animal selection",
                        }}
                      />
                    )}
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
                    inputProps={{
                      "aria-label": "Invoice date",
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Due Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!errors.dueDate}
                    helperText={errors.dueDate?.message}
                    inputProps={{
                      "aria-label": "Due date",
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="invoiceNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Invoice Number"
                    fullWidth
                    error={!!errors.invoiceNumber}
                    helperText={errors.invoiceNumber?.message}
                    inputProps={{
                      "aria-label": "Invoice number",
                    }}
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
                    <Select
                      {...field}
                      label="Status"
                      inputProps={{ "aria-label": "Invoice status" }}
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="sent">Sent</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            {status === "paid" && (
              <>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth error={!!errors.paymentMethod}>
                    <InputLabel>Payment Method</InputLabel>
                    <Controller
                      name="paymentMethod"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Payment Method"
                          inputProps={{ "aria-label": "Payment method" }}
                        >
                          <MenuItem value="cash">Cash</MenuItem>
                          <MenuItem value="credit_card">Credit Card</MenuItem>
                          <MenuItem value="bank_transfer">
                            Bank Transfer
                          </MenuItem>
                          <MenuItem value="check">Check</MenuItem>
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
                        inputProps={{
                          "aria-label": "Payment date",
                        }}
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
              aria-label="Add item"
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
                          value={item.procedure || ""}
                          onChange={(e) =>
                            handleItemChange(index, "procedure", e.target.value)
                          }
                          inputProps={{ "aria-label": "Procedure" }}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            <em>Select a procedure</em>
                          </MenuItem>
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
                        inputProps={{ "aria-label": "Description" }}
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
                        inputProps={{
                          min: 1,
                          style: { textAlign: "right" },
                          "aria-label": "Quantity",
                        }}
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
                          "aria-label": "Unit price",
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
                        aria-label="Remove item"
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
        <Button onClick={onCancel} aria-label="Cancel">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          aria-label={invoice ? "Save invoice changes" : "Create new invoice"}
        >
          {invoice ? "Save Changes" : "Create Invoice"}
        </Button>
      </DialogActions>
    </>
  );
}

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
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Invoice, InvoiceItem, Animal } from "../../types/models";
import api from "../../utils/api";
import clinicServicesData from "../../data/clinicServices.json";

// Combined interface for clients and organizations in the dropdown
interface ClientOption {
  id: string;
  name: string;
  type: "client" | "organization";
  email: string;
  phone: string;
  address: string;
}

// Transform clinic services data into searchable format
interface ServiceOption {
  id: string;
  name: string;
  price: number;
  category: string;
  priceDisplay: string;
}

const transformServicesData = (): ServiceOption[] => {
  const services: ServiceOption[] = [];

  clinicServicesData.forEach((category) => {
    category.services.forEach((service, index) => {
      // Parse price - handle various formats like "$140", "Free with microchip", "$10 per dose"
      let price = 0;
      let priceDisplay = service.price;

      // Extract numeric value from price string
      const priceMatch = service.price.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }

      services.push({
        id: `${category.category}-${index}`,
        name: service.name,
        price: price,
        category: category.category,
        priceDisplay: priceDisplay,
      });
    });
  });

  return services;
};

// Custom filter function for better search experience
const filterOptions = (options: ServiceOption[], { inputValue }: any) => {
  const searchTerm = inputValue.toLowerCase();
  if (!searchTerm) return options;

  return options.filter(
    (option) =>
      option.name.toLowerCase().includes(searchTerm) ||
      option.category.toLowerCase().includes(searchTerm)
  );
};

const availableServices = transformServicesData();

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
  paymentMethod?:
    | "cash"
    | "credit_card"
    | "bank_transfer"
    | "check"
    | ""
    | null;
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
    .oneOf(["cash", "credit_card", "bank_transfer", "check", "", null])
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
  // Initialize with existing items or a single blank item
  const initializeItems = (): InvoiceItem[] => {
    if (invoice?.items && invoice.items.length > 0) {
      return invoice.items.map((item) => ({
        ...item,
        quantity: Math.max(1, parseInt(String(item.quantity)) || 1),
        unitPrice: parseFloat(Number(item.unitPrice || 0).toFixed(2)),
        total: parseFloat(Number(item.total || 0).toFixed(2)),
      }));
    }
    // Always start with one blank item
    return [
      {
        id: "temp-1",
        invoiceId: "",
        procedure: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ];
  };
  const [items, setItems] = useState<InvoiceItem[]>(initializeItems());
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(
    null
  );
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
      paymentMethod: invoice?.paymentMethod || "",
      paymentDate: invoice?.paymentDate?.toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientResponse = await api.get("/clients");
        const transformedClients = Array.isArray(clientResponse)
          ? clientResponse.map((client: any) => ({
              id: client._id || client.id,
              name: `${client.firstName} ${client.lastName}`,
              type: "client" as const,
              email: client.email,
              phone: client.phone,
              address: `${client.address?.street || ""}, ${
                client.address?.city || ""
              }, ${client.address?.state || ""} ${
                client.address?.zipCode || ""
              }`.trim(),
            }))
          : [];

        // Fetch organizations
        const organizationResponse = await api.get("/organizations");
        const transformedOrganizations = Array.isArray(organizationResponse)
          ? organizationResponse.map((org: any) => ({
              id: org._id || org.id,
              name: org.name,
              type: "organization" as const,
              email: org.email,
              phone: org.phone,
              address: org.address || "",
            }))
          : [];

        // Combine clients and organizations
        const combinedOptions = [
          ...transformedClients,
          ...transformedOrganizations,
        ];
        setClientOptions(combinedOptions);

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
              organization:
                typeof animal.organization === "object"
                  ? animal.organization._id || animal.organization.id
                  : animal.organization,
            }))
          : [];
        setAnimals(transformedAnimals);

        // If we have an invoice being edited, set the client and animal
        if (invoice) {
          // Find matching client or organization
          const matchingClient = combinedOptions.find(
            (c) => c.id === invoice.clientId
          );
          if (matchingClient) {
            setSelectedClient(matchingClient);
            setValue("clientId", matchingClient.id);
          }

          // Find matching animal
          const matchingAnimal = transformedAnimals.find(
            (a) => a.id === invoice.animalId || a._id === invoice.animalId
          );
          if (matchingAnimal) {
            setSelectedAnimal(matchingAnimal);
            setValue("animalId", matchingAnimal.id);
          }
        }
      } catch (err) {
        // Silently handle data fetch errors
      }
    };

    fetchData();
  }, [invoice, setValue]);
  // Filter animals based on selected client or organization
  const filteredAnimals = selectedClient
    ? animals.filter((animal) =>
        selectedClient.type === "client"
          ? animal.client === selectedClient.id
          : animal.organization === selectedClient.id
      )
    : animals;

  const getClientOptionLabel = (option: ClientOption | null) => {
    if (!option) return "";
    return `${option.name}${
      option.type === "organization" ? " (Organization)" : ""
    }`;
  };

  const getAnimalOptionLabel = (option: Animal | null) => {
    if (!option) return "";
    return `${option.name} (${option.species})`;
  };

  const handleClientChange = (client: ClientOption | null) => {
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
    // Only calculate totals for items with content
    const validItems = items.filter(
      (item) => item.procedure.trim() !== "" || item.description.trim() !== ""
    );

    const subtotal = parseFloat(
      validItems
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
  const handleRemoveItem = (index: number) => {
    // Don't allow removing the last item if it would leave no items
    if (items.length === 1) {
      // Reset the item instead of removing it
      const resetItem: InvoiceItem = {
        id: `temp-1`,
        invoiceId: invoice?.id || "",
        procedure: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      };
      setItems([resetItem]);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };
  const handleServiceSelection = (
    index: number,
    service: ServiceOption | null
  ) => {
    const newItems = [...items];
    if (service) {
      // Update the current item with selected service
      newItems[index] = {
        ...newItems[index],
        procedure: service.name,
        description: service.name, // Set description to same as procedure name
        unitPrice: service.price,
        total: service.price * newItems[index].quantity,
      };

      // Check if this is the last item and if it has content, add a new blank item
      const isLastItem = index === items.length - 1;
      const hasContent = service.name.trim() !== "";

      if (isLastItem && hasContent) {
        const newBlankItem: InvoiceItem = {
          id: `temp-${items.length + 1}`,
          invoiceId: invoice?.id || "",
          procedure: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        };
        newItems.push(newBlankItem);
      }
    } else {
      // Clear the service selection
      newItems[index] = {
        ...newItems[index],
        procedure: "",
        description: "",
        unitPrice: 0,
        total: 0,
      };
    }

    setItems(newItems);
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

      // Recalculate total whenever quantity or unitPrice changes
      if (field === "quantity" || field === "unitPrice") {
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

    // Filter out empty items (items without procedure or description)
    const validItems = items.filter(
      (item) => item.procedure.trim() !== "" || item.description.trim() !== ""
    );

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
      items: validItems.map((item) => ({
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
                    options={clientOptions}
                    value={selectedClient}
                    getOptionLabel={getClientOptionLabel}
                    onChange={(_, value) => handleClientChange(value)}
                    isOptionEqualToValue={(option, value) =>
                      option?.id === value?.id
                    }
                    // Disable if editing an existing invoice
                    disabled={!!invoice}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Client / Organization"
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
                          "aria-label": "Client or organization selection",
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
                            : "Please select a client or organization first"
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
          </Grid>{" "}
          <Box
            sx={{
              mt: 4,
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="h6">Items</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: { xs: "left", sm: "right" },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Select services to automatically add pricing
            </Typography>
          </Box>
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 300, width: "50%" }}>
                    Procedure
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 80, width: "10%" }}>
                    Qty
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 120, width: "15%" }}>
                    Unit Price
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 120, width: "15%" }}>
                    Total
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ minWidth: 100, width: "10%" }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ minWidth: 300, width: "50%" }}>
                      <Autocomplete
                        options={availableServices}
                        getOptionLabel={(option) => option.name}
                        groupBy={(option) => option.category}
                        value={
                          availableServices.find(
                            (service) => service.name === item.procedure
                          ) || null
                        }
                        onChange={(_, service) =>
                          handleServiceSelection(index, service)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search services..."
                            fullWidth
                            variant="outlined"
                            size="small"
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} key={option.id}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                alignItems: "center",
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" noWrap>
                                  {option.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {option.category}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                color="primary"
                                sx={{
                                  fontWeight: "medium",
                                  ml: 1,
                                  flexShrink: 0,
                                }}
                              >
                                {option.priceDisplay}
                              </Typography>
                            </Box>
                          </li>
                        )}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        filterOptions={filterOptions}
                        size="small"
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ minWidth: 80, width: "10%" }}
                    >
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
                        size="small"
                        sx={{ width: "100%", maxWidth: "80px" }}
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ minWidth: 120, width: "15%" }}
                    >
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
                        size="small"
                        sx={{ width: "100%", maxWidth: "110px" }}
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ minWidth: 120, width: "15%" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {formatCurrency(item.total)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ minWidth: 100, width: "10%" }}
                    >
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
                  <TableCell colSpan={3} align="right">
                    <Typography variant="subtitle1">Subtotal</Typography>
                  </TableCell>
                  <TableCell align="right" colSpan={2}>
                    <Typography variant="subtitle1">
                      {formatCurrency(subtotal)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} align="right">
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
                  <TableCell colSpan={3} align="right">
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

import { useState, useEffect, useMemo } from "react";
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
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Invoice,
  InvoiceAnimalSection,
  InvoiceItem,
  Animal,
} from "../../types/models";
import api from "../../utils/api";
import {
  createLocalDate,
  formatDateForInput,
  getTodayForInput,
  getDateDaysFromNow,
} from "../../utils/dateUtils";

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

interface ServiceCategory {
  category: string;
  services: { name: string; price: string }[];
}

const transformServicesData = (
  servicesData: ServiceCategory[]
): ServiceOption[] => {
  const services: ServiceOption[] = [];

  // Defensive check to ensure servicesData is an array
  if (!Array.isArray(servicesData)) {
    return services;
  }

  servicesData.forEach((category) => {
    // Ensure category.services is also an array
    if (!Array.isArray(category.services)) {
      return;
    }

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

  // Sort by category first, prioritizing clinic's own services, then by name
  return services.sort((a, b) => {
    if (a.category !== b.category) {
      // Define clinic's own service categories (to be listed first)
      const clinicCategories = [
        "Surgery Days - General Services",
        "Vaccine Clinic",
      ];

      const aIsClinic = clinicCategories.includes(a.category);
      const bIsClinic = clinicCategories.includes(b.category);

      // If one is clinic service and other is not, prioritize clinic service
      if (aIsClinic && !bIsClinic) return -1;
      if (!aIsClinic && bIsClinic) return 1;

      // If both are clinic services or both are external, sort alphabetically
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
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

// Generate a unique invoice number
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `INV-${year}${month}-${random}`;
};

interface InvoiceFormData {
  clientId: string;
  selectedAnimals: string[];
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
  selectedAnimals: yup
    .array()
    .of(yup.string().required())
    .min(1, "At least one animal is required")
    .required(),
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
    .required()
    .oneOf(["draft", "sent", "paid", "overdue", "cancelled"]),
  paymentMethod: yup
    .string()
    .nullable()
    .oneOf(["cash", "credit_card", "bank_transfer", "check", null]),
  paymentDate: yup.string().nullable(),
});

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSave: (invoiceData: Partial<Invoice>) => Promise<void>;
  onCancel: () => void;
}

export default function InvoiceForm({
  invoice,
  onSave,
  onCancel,
}: InvoiceFormProps) {
  // Initialize animal sections - one section per selected animal
  const initializeAnimalSections = (): InvoiceAnimalSection[] => {
    if (invoice?.animalSections) {
      return invoice.animalSections;
    }
    return [];
  };

  const [animalSections, setAnimalSections] = useState<InvoiceAnimalSection[]>(
    initializeAnimalSections()
  );
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(
    null
  );
  const [selectedAnimals, setSelectedAnimals] = useState<Animal[]>([]);
  const [servicesData, setServicesData] = useState<ServiceCategory[]>([]);
  const [, setServicesLoading] = useState<boolean>(true);

  // Create dynamic service options including custom procedures from current invoice
  const dynamicServiceOptions = useMemo((): ServiceOption[] => {
    // Early return if services data is not ready
    if (!servicesData || !Array.isArray(servicesData)) {
      return [];
    }

    const availableServices = transformServicesData(servicesData);
    const customProcedures: ServiceOption[] = [];
    const addedProcedures = new Set<string>();

    // Add custom procedures from current invoice when editing
    if (invoice?.animalSections) {
      invoice.animalSections.forEach((section) => {
        section.items.forEach((item) => {
          const foundInAvailable = availableServices.find(
            (s) => s.name === item.procedure
          );

          if (
            item.procedure &&
            !foundInAvailable &&
            !addedProcedures.has(item.procedure)
          ) {
            customProcedures.push({
              id: `custom-${item.procedure}`,
              name: item.procedure,
              price: item.unitPrice || 0,
              category: "Custom/Previous",
              priceDisplay: `$${item.unitPrice || 0}`,
            });
            addedProcedures.add(item.procedure);
          }
        });
      });
    }

    // Also add custom procedures from current animalSections state
    animalSections.forEach((section) => {
      section.items.forEach((item) => {
        if (
          item.procedure &&
          !availableServices.find((s) => s.name === item.procedure) &&
          !addedProcedures.has(item.procedure)
        ) {
          customProcedures.push({
            id: `custom-${item.procedure}`,
            name: item.procedure,
            price: item.unitPrice || 0,
            category: "Custom/Previous",
            priceDisplay: `$${item.unitPrice || 0}`,
          });
          addedProcedures.add(item.procedure);
        }
      });
    });

    return [...availableServices, ...customProcedures];
  }, [invoice, animalSections, servicesData]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      clientId: invoice?.clientId || "",
      selectedAnimals:
        invoice?.animalSections?.map((section) => section.animalId) || [],
      date: invoice?.date
        ? formatDateForInput(invoice.date)
        : getTodayForInput(),
      dueDate: invoice?.dueDate
        ? formatDateForInput(invoice.dueDate)
        : formatDateForInput(getDateDaysFromNow(30)),
      invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
      status: invoice?.status || "draft",
      paymentMethod: invoice?.paymentMethod || null,
      paymentDate: invoice?.paymentDate
        ? formatDateForInput(invoice.paymentDate)
        : null,
    },
  });

  // Effect to load clients and organizations
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // Only fetch clients and organizations initially
        const [clientResponse, orgResponse] = await Promise.all([
          api.get("/clients"),
          api.get("/organizations"),
        ]);

        // Transform clients and organizations into a combined options array
        const clients = Array.isArray(clientResponse)
          ? clientResponse.map((client: any) => ({
              id: client._id || client.id,
              name: `${client.firstName} ${client.lastName}`,
              type: "client" as const,
              email: client.email || "",
              phone: client.phone || "",
              address: `${client.address?.street || ""} ${
                client.address?.city || ""
              }`.trim(),
            }))
          : [];

        const organizations = Array.isArray(orgResponse)
          ? orgResponse.map((org: any) => ({
              id: org._id || org.id,
              name: org.name,
              type: "organization" as const,
              email: org.contactEmail || "",
              phone: org.contactPhone || "",
              address: `${org.address?.street || ""} ${
                org.address?.city || ""
              }`.trim(),
            }))
          : [];

        const combinedOptions = [...clients, ...organizations];
        setClientOptions(combinedOptions);

        // Set selected options if editing an existing invoice
        if (invoice) {
          const matchingClient = combinedOptions.find(
            (c) => c.id === invoice.clientId
          );
          if (matchingClient) {
            setSelectedClient(matchingClient);
            setValue("clientId", matchingClient.id);
          }
        }
      } catch (err) {
        console.error("Error fetching client/organization data:", err);
      }
    };

    fetchClientData();
  }, [invoice, setValue]);

  // Effect to load services data
  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        setServicesLoading(true);
        const response = await api.get("/services");
        // The api utility already extracts response.data, so response IS the data
        setServicesData(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Error fetching services data:", err);
        // Fallback to empty array if services can't be loaded
        setServicesData([]);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServicesData();
  }, []);

  // Separate effect to fetch animals when needed
  useEffect(() => {
    const fetchAnimalsData = async () => {
      try {
        setAnimalsLoading(true);

        // Fetch all animals for selection
        const animalResponse = await api.get("/animals");

        // Transform animals
        const transformedAnimals = Array.isArray(animalResponse)
          ? animalResponse.map((animal: any) => ({
              ...animal,
              id: animal._id || animal.id,
            }))
          : [];
        setAnimals(transformedAnimals);

        // Set selected animals if editing an existing invoice
        if (invoice) {
          const matchingAnimals = transformedAnimals.filter((a) =>
            invoice.animalSections?.some(
              (section) =>
                section.animalId === a.id || section.animalId === a._id
            )
          );
          if (matchingAnimals.length > 0) {
            setSelectedAnimals(matchingAnimals);
            setValue(
              "selectedAnimals",
              matchingAnimals.map((a) => a.id)
            );
          }
        }
      } catch (err) {
        console.error("Error fetching animals data:", err);
      } finally {
        setAnimalsLoading(false);
      }
    };

    fetchAnimalsData();
  }, [invoice, setValue]);

  // Effect to update animal sections when selected animals change
  useEffect(() => {
    // Don't override existing invoice data during initial load
    if (
      invoice &&
      animalSections.length > 0 &&
      animalSections[0].items[0].procedure !== ""
    ) {
      return;
    }

    const currentAnimalIds = animalSections.map((section) => section.animalId);
    const selectedAnimalIds = selectedAnimals.map((animal) => animal.id);

    // Remove sections for unselected animals
    const filteredSections = animalSections.filter((section) =>
      selectedAnimalIds.includes(section.animalId)
    );

    // Add sections for newly selected animals
    const newSections = selectedAnimalIds
      .filter((animalId) => !currentAnimalIds.includes(animalId))
      .map((animalId) => ({
        animalId,
        items: [
          {
            id: `temp-${Date.now()}`,
            procedure: "",
            description: "",
            quantity: 1,
            unitPrice: 0,
            total: 0,
          },
        ],
        subtotal: 0,
      }));

    setAnimalSections([...filteredSections, ...newSections]);
  }, [selectedAnimals]);

  // Filter animals based on selected client or organization
  const filteredAnimals = selectedClient
    ? animals.filter((animal) => {
        const animalClientId =
          typeof animal.client === "object" && animal.client
            ? (animal.client as any)._id || (animal.client as any).id
            : animal.client;

        const animalOrgId =
          typeof animal.organization === "object" && animal.organization
            ? (animal.organization as any)._id ||
              (animal.organization as any).id
            : animal.organization;

        const isMatch =
          selectedClient.type === "client"
            ? animalClientId === selectedClient.id
            : animalOrgId === selectedClient.id;

        return isMatch;
      })
    : animals; // Show all animals when no client is selected

  const getAnimalOptionLabel = (option: Animal) => {
    if (!option) return "";
    return `${option.name} (${option.species})`;
  };

  const handleClientChange = (client: ClientOption | null) => {
    setSelectedClient(client);
    setValue("clientId", client?.id || "");
    // Reset animal selection when client changes
    setValue("selectedAnimals", []);
    setSelectedAnimals([]);
    setAnimalSections([]);
  };

  const handleAnimalSelectionChange = (animals: Animal[]) => {
    setSelectedAnimals(animals);
    setValue(
      "selectedAnimals",
      animals.map((animal) => animal.id)
    );
  };

  // Calculate totals for a specific animal section
  const calculateSectionTotals = (sectionIndex: number) => {
    const section = animalSections[sectionIndex];
    if (!section) return { subtotal: 0 };

    const validItems = section.items.filter(
      (item) => item.procedure.trim() !== "" || item.description.trim() !== ""
    );

    const subtotal = validItems.reduce((sum, item) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      return sum + itemTotal;
    }, 0);

    return { subtotal };
  };

  // Calculate invoice totals
  const calculateTotals = () => {
    let totalSubtotal = 0;

    animalSections.forEach((_, index) => {
      const { subtotal } = calculateSectionTotals(index);
      totalSubtotal += subtotal;
    });

    return {
      subtotal: totalSubtotal,
      total: totalSubtotal, // No tax for now
    };
  };

  // Update item in a specific animal section
  const updateSectionItem = (
    sectionIndex: number,
    itemIndex: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newSections = [...animalSections];
    const section = newSections[sectionIndex];

    if (section && section.items[itemIndex]) {
      const updatedItem = { ...section.items[itemIndex] };

      if (field === "quantity" || field === "unitPrice") {
        (updatedItem[field] as number) = Number(value) || 0;
      } else if (
        field === "id" ||
        field === "procedure" ||
        field === "description"
      ) {
        (updatedItem[field] as string) = value as string;
      } else if (field === "total") {
        (updatedItem[field] as number) = Number(value) || 0;
      }

      // Recalculate item total
      if (field === "quantity" || field === "unitPrice") {
        updatedItem.total = parseFloat(
          (
            Number(updatedItem.quantity) * Number(updatedItem.unitPrice)
          ).toFixed(2)
        );
      }

      section.items[itemIndex] = updatedItem;

      // Update section subtotal
      const { subtotal } = calculateSectionTotals(sectionIndex);
      section.subtotal = subtotal;

      setAnimalSections(newSections);
    }
  };

  // Add item to a specific animal section
  const addSectionItem = (sectionIndex: number) => {
    const newSections = [...animalSections];
    const section = newSections[sectionIndex];

    if (section) {
      section.items.push({
        id: `temp-${Date.now()}`,
        procedure: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      });

      setAnimalSections(newSections);
    }
  };

  // Remove item from a specific animal section
  const removeSectionItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...animalSections];
    const section = newSections[sectionIndex];

    if (section && section.items.length > 1) {
      section.items.splice(itemIndex, 1);

      // Update section subtotal
      const { subtotal } = calculateSectionTotals(sectionIndex);
      section.subtotal = subtotal;

      setAnimalSections(newSections);
    }
  };

  // Validate that selected animals belong to the selected client/organization
  const validateAnimalClientMatch = (): string | null => {
    if (!selectedClient || selectedAnimals.length === 0) {
      return null; // No validation needed if no client or animals selected
    }

    const invalidAnimals = selectedAnimals.filter((animal) => {
      const animalClientId =
        typeof animal.client === "object" && animal.client
          ? (animal.client as any)._id || (animal.client as any).id
          : animal.client;

      const animalOrgId =
        typeof animal.organization === "object" && animal.organization
          ? (animal.organization as any)._id || (animal.organization as any).id
          : animal.organization;

      const isMatch =
        selectedClient.type === "client"
          ? animalClientId === selectedClient.id
          : animalOrgId === selectedClient.id;

      return !isMatch;
    });

    if (invalidAnimals.length > 0) {
      const animalNames = invalidAnimals.map((a) => a.name).join(", ");
      return `The following animals don't belong to the selected ${selectedClient.type}: ${animalNames}`;
    }

    return null;
  };

  const onSubmit = (data: InvoiceFormData) => {
    // Validate animal-client relationship
    const validationError = validateAnimalClientMatch();
    if (validationError) {
      alert(validationError);
      return;
    }

    const { subtotal, total } = calculateTotals();

    // Filter out animal sections with no valid items
    const validSections = animalSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.procedure.trim() !== "" || item.description.trim() !== ""
        ),
      }))
      .filter((section) => section.items.length > 0);

    if (validSections.length === 0) {
      alert("Please add at least one service item for one animal.");
      return;
    }

    // Create invoice object
    const invoiceBase = {
      client: data.clientId,
      animalSections: validSections.map((section) => ({
        animalId: section.animalId,
        items: section.items.map((item) => ({
          id: item.id,
          description: item.description,
          procedure: item.procedure,
          quantity: Number(item.quantity),
          unitPrice: parseFloat(Number(item.unitPrice).toFixed(2)),
          total: parseFloat(
            (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)
          ),
        })),
        subtotal: parseFloat(section.subtotal.toFixed(2)),
      })),
      invoiceNumber: data.invoiceNumber,
      date: createLocalDate(data.date),
      dueDate: createLocalDate(data.dueDate),
      status: data.status,
      paymentMethod: data.paymentMethod === "" ? null : data.paymentMethod,
      paymentDate: data.paymentDate
        ? createLocalDate(data.paymentDate)
        : undefined,
      subtotal: parseFloat(subtotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };

    onSave(invoiceBase);
  };

  return (
    <>
      <DialogTitle>
        {invoice ? "Edit Invoice" : "Create New Invoice"}
      </DialogTitle>
      <DialogContent sx={{ minWidth: 800, maxHeight: "80vh", pt: 3 }}>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }}
        >
          {/* Basic Invoice Information */}
          <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="clientId"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Autocomplete
                    {...field}
                    options={clientOptions}
                    value={selectedClient}
                    getOptionLabel={(option) => option?.name || ""}
                    onChange={(_, value) => handleClientChange(value)}
                    isOptionEqualToValue={(option, value) =>
                      option?.id === value?.id
                    }
                    disabled={!!invoice}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Client or Organization"
                        fullWidth
                        error={!!errors.clientId}
                        helperText={
                          invoice
                            ? "Client cannot be changed after invoice creation"
                            : errors.clientId?.message
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
                name="selectedAnimals"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    options={filteredAnimals}
                    value={selectedAnimals}
                    getOptionLabel={getAnimalOptionLabel}
                    onChange={(_, newValue) => {
                      const validAnimals = newValue.filter(
                        (animal): animal is Animal => animal !== null
                      );
                      handleAnimalSelectionChange(validAnimals);
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option?.id === value?.id
                    }
                    disabled={!!invoice}
                    loading={animalsLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Animals"
                        fullWidth
                        error={!!errors.selectedAnimals}
                        helperText={
                          invoice
                            ? "Animals cannot be changed after invoice creation"
                            : animalsLoading
                            ? "Loading animals..."
                            : !selectedClient
                            ? "Select a client first to filter animals, or choose from all animals"
                            : errors.selectedAnimals?.message
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
                    disabled={!!invoice}
                    error={!!errors.invoiceNumber}
                    helperText={
                      invoice
                        ? "Invoice number cannot be changed"
                        : errors.invoiceNumber?.message
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status">
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="sent">Sent</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          {/* Payment Information Section */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.paymentMethod}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      {...field}
                      label="Payment Method"
                      value={field.value || ""}
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="check">Check</MenuItem>
                      <MenuItem value="credit_card">Credit/Debit Card</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    </Select>
                    {errors.paymentMethod && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ ml: 2 }}
                      >
                        {errors.paymentMethod.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Payment Date"
                    type="date"
                    fullWidth
                    value={field.value || ""}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!errors.paymentDate}
                    helperText={errors.paymentDate?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Animal Sections */}
          {animalSections.map((section, sectionIndex) => {
            const animal = animals.find((a) => a.id === section.animalId);
            const sectionTotals = calculateSectionTotals(sectionIndex);

            return (
              <Accordion
                key={`section-${section.animalId}-${sectionIndex}`}
                defaultExpanded
                sx={{ mb: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    {animal
                      ? `${animal.name} (${animal.species})`
                      : "Unknown Animal"}{" "}
                    - Subtotal: ${sectionTotals.subtotal.toFixed(2)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell width={300}>Procedure</TableCell>
                            <TableCell width={150}>Description</TableCell>
                            <TableCell width={100}>Quantity</TableCell>
                            <TableCell width={120}>Unit Price</TableCell>
                            <TableCell width={120}>Total</TableCell>
                            <TableCell width={60}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {section.items.map((item, itemIndex) => (
                            <TableRow
                              key={`item-${section.animalId}-${itemIndex}-${item.id}`}
                            >
                              <TableCell sx={{ width: 300 }}>
                                <Autocomplete<ServiceOption>
                                  options={dynamicServiceOptions}
                                  getOptionLabel={(option) =>
                                    option?.name || ""
                                  }
                                  groupBy={(option) => option.category}
                                  value={
                                    item.procedure
                                      ? dynamicServiceOptions.find(
                                          (service) =>
                                            service.name === item.procedure
                                        ) || null
                                      : null
                                  }
                                  onChange={(_, selectedService) => {
                                    if (selectedService) {
                                      updateSectionItem(
                                        sectionIndex,
                                        itemIndex,
                                        "procedure",
                                        selectedService.name
                                      );
                                      updateSectionItem(
                                        sectionIndex,
                                        itemIndex,
                                        "description",
                                        selectedService.name
                                      );
                                      updateSectionItem(
                                        sectionIndex,
                                        itemIndex,
                                        "unitPrice",
                                        selectedService.price
                                      );
                                    } else {
                                      // Clear the service selection
                                      updateSectionItem(
                                        sectionIndex,
                                        itemIndex,
                                        "procedure",
                                        ""
                                      );
                                      updateSectionItem(
                                        sectionIndex,
                                        itemIndex,
                                        "description",
                                        ""
                                      );
                                      updateSectionItem(
                                        sectionIndex,
                                        itemIndex,
                                        "unitPrice",
                                        0
                                      );
                                    }
                                  }}
                                  filterOptions={filterOptions}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      size="small"
                                      fullWidth
                                      placeholder="Search services..."
                                      sx={{ minWidth: 280 }}
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
                                />
                              </TableCell>
                              <TableCell sx={{ width: 150 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={item.description}
                                  onChange={(e) =>
                                    updateSectionItem(
                                      sectionIndex,
                                      itemIndex,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  sx={{ maxWidth: 140 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  fullWidth
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateSectionItem(
                                      sectionIndex,
                                      itemIndex,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  inputProps={{ min: 1 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  fullWidth
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateSectionItem(
                                      sectionIndex,
                                      itemIndex,
                                      "unitPrice",
                                      e.target.value
                                    )
                                  }
                                  inputProps={{ min: 0, step: 0.01 }}
                                />
                              </TableCell>
                              <TableCell>
                                $
                                {(
                                  Number(item.quantity) * Number(item.unitPrice)
                                ).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    removeSectionItem(sectionIndex, itemIndex)
                                  }
                                  disabled={section.items.length <= 1}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => addSectionItem(sectionIndex)}
                        variant="outlined"
                        size="small"
                      >
                        Add Service
                      </Button>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Section Subtotal: ${sectionTotals.subtotal.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}

          {/* Invoice Summary */}
          {animalSections.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h6" gutterBottom>
                      Invoice Summary
                    </Typography>
                    <Typography variant="body1">
                      Animals: {selectedAnimals.map((a) => a.name).join(", ")}
                    </Typography>
                    <Typography variant="body1">
                      Total Services:{" "}
                      {animalSections.reduce(
                        (sum, section) => sum + section.items.length,
                        0
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ textAlign: "right" }}>
                    <Typography variant="h6">
                      Subtotal: ${calculateTotals().subtotal.toFixed(2)}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      Total: ${calculateTotals().total.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={animalSections.length === 0}
        >
          {invoice ? "Update Invoice" : "Create Invoice"}
        </Button>
      </DialogActions>
    </>
  );
}

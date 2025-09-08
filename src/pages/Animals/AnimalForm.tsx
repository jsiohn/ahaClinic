import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Box,
} from "@mui/material";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Animal, Client } from "../../types/models";
import { formatDateForInput, createLocalDate } from "../../utils/dateUtils";

interface AnimalFormData {
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed: string;
  age?: string; // Keep for backward compatibility
  ageYears?: string;
  ageMonths?: string;
  gender: "MALE" | "FEMALE";
  weight: string | null;
  clientId?: string;
  microchipNumber?: string;
  dateOfBirth?: string;
  isSpayedNeutered?: "YES" | "NO";
  spayNeuterDate?: string;
  color?: string;
  vaccineDate?: string;
  nextVaccineDate?: string;
  tagNumber?: string;
  vaccineSerial?: string;
  vaccineManufacturer?: string;
  lotExpiration?: string;
}

interface AnimalFormProps {
  animal?: Animal | null;
  clients: Client[];
  onSave: (data: Partial<Animal>) => void;
  onCancel: () => void;
}

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  species: yup
    .string()
    .oneOf(["DOG", "CAT", "OTHER"])
    .required("Species is required"),
  breed: yup.string().required(),
  age: yup
    .string()
    .optional()
    .transform((curr, orig) => (orig === "" ? undefined : curr))
    .test("age", "Age must be a positive whole number", (value) => {
      if (!value) return true;
      const num = parseInt(value);
      return !isNaN(num) && num > 0 && Number.isInteger(num);
    }),
  ageYears: yup
    .string()
    .optional()
    .transform((curr, orig) => (orig === "" ? undefined : curr))
    .test("ageYears", "Years must be a non-negative whole number", (value) => {
      if (!value) return true;
      const num = parseInt(value);
      return !isNaN(num) && num >= 0 && Number.isInteger(num);
    }),
  ageMonths: yup
    .string()
    .optional()
    .transform((curr, orig) => (orig === "" ? undefined : curr))
    .test("ageMonths", "Months must be between 0 and 11", (value) => {
      if (!value) return true;
      const num = parseInt(value);
      return !isNaN(num) && num >= 0 && num <= 11 && Number.isInteger(num);
    }),
  gender: yup.string().oneOf(["MALE", "FEMALE"]).required("Gender is required"),
  weight: yup
    .string()
    .transform((curr, orig) => (orig === "" ? null : curr))
    .nullable()
    .test("weight", "Weight must be a positive number", (value) => {
      if (value === null) return true;
      if (typeof value === "undefined") return false;
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    })
    .required("Weight is required")
    .nullable(),
  clientId: yup.string().optional(),
  microchipNumber: yup.string().optional(),
  dateOfBirth: yup
    .string()
    .optional()
    .test("is-date-valid", "Invalid date format. Use MM-DD-YYYY", (value) => {
      if (!value) return true; // Optional field can be empty
      return !isNaN(Date.parse(value));
    }),
  isSpayedNeutered: yup.string().oneOf(["YES", "NO"]).optional(),
  spayNeuterDate: yup
    .string()
    .optional()
    .test("valid-date", "Invalid date format", (value) => {
      if (!value) return true; // Optional field can be empty
      return !isNaN(Date.parse(value));
    }),
  color: yup.string().optional(),
  vaccineDate: yup
    .string()
    .optional()
    .test("valid-date", "Invalid date format", (value) => {
      if (!value) return true;
      return !isNaN(Date.parse(value));
    }),
  nextVaccineDate: yup
    .string()
    .optional()
    .test("valid-date", "Invalid date format", (value) => {
      if (!value) return true;
      return !isNaN(Date.parse(value));
    }),
  tagNumber: yup.string().optional(),
  vaccineSerial: yup.string().optional(),
  vaccineManufacturer: yup.string().optional(),
  lotExpiration: yup
    .string()
    .optional()
    .test("valid-date", "Invalid date format", (value) => {
      if (!value) return true;
      return !isNaN(Date.parse(value));
    }),
}) satisfies yup.ObjectSchema<AnimalFormData>;

export default function AnimalForm({
  animal,
  clients,
  onSave,
  onCancel,
}: AnimalFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AnimalFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: animal?.name || "",
      species: animal?.species || "CAT",
      breed: animal?.breed || "",
      age: animal?.age?.toString() || "",
      ageYears: animal?.ageYears?.toString() || "",
      ageMonths: animal?.ageMonths?.toString() || "",
      gender: (animal?.gender?.toUpperCase() as "MALE" | "FEMALE") || "MALE",
      weight: animal?.weight?.toString() || "",
      clientId: animal?.client || "", // Use client instead of clientId
      microchipNumber: animal?.microchipNumber || "",
      dateOfBirth: animal?.dateOfBirth
        ? formatDateForInput(animal.dateOfBirth)
        : "",
      isSpayedNeutered: animal?.isSpayedNeutered ? "YES" : "NO",
      spayNeuterDate: animal?.spayNeuterDate
        ? formatDateForInput(animal.spayNeuterDate)
        : "",
      color: animal?.color || "",
      vaccineDate: animal?.vaccineDate
        ? formatDateForInput(animal.vaccineDate)
        : "",
      nextVaccineDate: animal?.nextVaccineDate
        ? formatDateForInput(animal.nextVaccineDate)
        : "",
      tagNumber: animal?.tagNumber || "",
      vaccineSerial: animal?.vaccineSerial || "",
      vaccineManufacturer: animal?.vaccineManufacturer || "",
      lotExpiration: animal?.lotExpiration
        ? formatDateForInput(animal.lotExpiration)
        : "",
    },
  });

  // Watch the spay/neuter status to conditionally enable/disable the date field
  const watchedSpayNeuterStatus = useWatch({
    control,
    name: "isSpayedNeutered",
  });
  const onSubmit = (data: AnimalFormData) => {
    // Set isSpayedNeutered based on the dropdown selection
    const isSpayedNeutered = data.isSpayedNeutered === "YES";

    const submissionData = {
      name: data.name,
      species: data.species,
      breed: data.breed,
      age: data.age ? parseInt(data.age) : undefined,
      ageYears: data.ageYears ? parseInt(data.ageYears) : undefined,
      ageMonths: data.ageMonths ? parseInt(data.ageMonths) : undefined,
      gender: data.gender.toLowerCase() as "male" | "female" | "unknown",
      weight: data.weight ? Number(data.weight) : null,
      client: data.clientId || undefined,
      microchipNumber: data.microchipNumber,
      dateOfBirth: data.dateOfBirth
        ? createLocalDate(data.dateOfBirth)
        : undefined,
      isSpayedNeutered: isSpayedNeutered,
      spayNeuterDate:
        isSpayedNeutered && data.spayNeuterDate
          ? createLocalDate(data.spayNeuterDate)
          : undefined,
      color: data.color,
      vaccineDate: data.vaccineDate
        ? createLocalDate(data.vaccineDate)
        : undefined,
      nextVaccineDate: data.nextVaccineDate
        ? createLocalDate(data.nextVaccineDate)
        : undefined,
      tagNumber: data.tagNumber,
      vaccineSerial: data.vaccineSerial,
      vaccineManufacturer: data.vaccineManufacturer,
      lotExpiration: data.lotExpiration
        ? createLocalDate(data.lotExpiration)
        : undefined,
      id: animal?.id,
      medicalHistory: animal?.medicalHistory || [],
      createdAt: animal?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(submissionData);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const getClientOptionLabel = (option: Client | string) => {
    if (typeof option === "string") return "";
    return `${option.firstName} ${option.lastName}`;
  };

  return (
    <>
      <DialogTitle id="animal-dialog-title">
        {animal ? "Edit Animal" : "Add New Animal"}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          onKeyPress={handleKeyPress}
          sx={{ mt: 2 }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.species}>
                <InputLabel>Species</InputLabel>
                <Controller
                  name="species"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Species">
                      <MenuItem value="DOG">Dog</MenuItem>
                      <MenuItem value="CAT">Cat</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="breed"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Breed"
                    fullWidth
                    error={!!errors.breed}
                    helperText={errors.breed?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Color"
                    fullWidth
                    error={!!errors.color}
                    helperText={errors.color?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel>Gender</InputLabel>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Gender">
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Weight (lbs)"
                    type="number"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    error={!!errors.weight}
                    helperText={errors.weight?.message}
                    inputProps={{ min: 0, step: "0.1" }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="clientId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={clients}
                    getOptionLabel={getClientOptionLabel}
                    onChange={(_, newValue) => {
                      onChange(newValue ? newValue.id : "");
                    }}
                    value={clients.find((c) => c.id === value) || null}
                    isOptionEqualToValue={(option, value) =>
                      option.id ===
                      (typeof value === "string" ? value : value?.id)
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Client (Optional)"
                        error={!!errors.clientId}
                        helperText={errors.clientId?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="microchipNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Microchip Number"
                    fullWidth
                    error={!!errors.microchipNumber}
                    helperText={errors.microchipNumber?.message}
                  />
                )}
              />
            </Grid>{" "}
            <Grid item xs={12} sm={6}>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date of Birth"
                    type="date"
                    fullWidth
                    error={!!errors.dateOfBirth}
                    helperText={
                      errors.dateOfBirth?.message ||
                      "Optional - Use format MM-DD-YYYY"
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
            </Grid>{" "}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.isSpayedNeutered}>
                <InputLabel>Spayed/Neutered</InputLabel>
                <Controller
                  name="isSpayedNeutered"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Spayed/Neutered">
                      <MenuItem value="NO">No</MenuItem>
                      <MenuItem value="YES">Yes</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="spayNeuterDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Spay/Neuter Date"
                    type="date"
                    fullWidth
                    disabled={watchedSpayNeuterStatus !== "YES"}
                    error={!!errors.spayNeuterDate}
                    helperText={
                      watchedSpayNeuterStatus !== "YES"
                        ? "Select 'Yes' for spayed/neutered to enable this field"
                        : errors.spayNeuterDate?.message ||
                          "Enter the date when the animal was spayed/neutered"
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
            </Grid>{" "}
            <Grid item xs={12} sm={3}>
              <Controller
                name="ageYears"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Age (Years)"
                    type="number"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || "")}
                    error={!!errors.ageYears}
                    helperText={errors.ageYears?.message}
                    inputProps={{ min: 0, max: 50 }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name="ageMonths"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Age (Months)"
                    type="number"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || "")}
                    error={!!errors.ageMonths}
                    helperText={errors.ageMonths?.message || "0-11 months"}
                    inputProps={{ min: 0, max: 11 }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="vaccineDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Vaccine Date"
                    type="date"
                    fullWidth
                    error={!!errors.vaccineDate}
                    helperText={errors.vaccineDate?.message}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="nextVaccineDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Next Vaccine Date"
                    type="date"
                    fullWidth
                    error={!!errors.nextVaccineDate}
                    helperText={errors.nextVaccineDate?.message}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="tagNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tag Number"
                    fullWidth
                    error={!!errors.tagNumber}
                    helperText={errors.tagNumber?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="vaccineSerial"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Vaccine Serial #"
                    fullWidth
                    error={!!errors.vaccineSerial}
                    helperText={errors.vaccineSerial?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="vaccineManufacturer"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Vaccine Manufacturer"
                    fullWidth
                    error={!!errors.vaccineManufacturer}
                    helperText={errors.vaccineManufacturer?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="lotExpiration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Lot Expiration"
                    type="date"
                    fullWidth
                    error={!!errors.lotExpiration}
                    helperText={errors.lotExpiration?.message}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} tabIndex={0}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          tabIndex={0}
          type="submit"
        >
          {animal ? "Save Changes" : "Add Animal"}
        </Button>
      </DialogActions>
    </>
  );
}

export type { AnimalFormProps };

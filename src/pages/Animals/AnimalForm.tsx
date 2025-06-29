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
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Animal, Client } from "../../types/models";

interface AnimalFormData {
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed: string;
  age?: string;
  gender: "MALE" | "FEMALE";
  weight: string | null;
  clientId?: string;
  microchipNumber?: string;
  dateOfBirth: string;
  isSpayedNeutered?: string;
  spayNeuterDate?: string;
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
    .required("Date of birth is required")
    .test("is-date-valid", "Invalid date format. Use YYYY-MM-DD", (value) => {
      if (!value) return false;
      return !isNaN(Date.parse(value));
    }),
  isSpayedNeutered: yup.string().optional(),
  spayNeuterDate: yup
    .string()
    .optional()
    .test("valid-date", "Invalid date format", (value) => {
      if (!value) return true; // Optional field can be empty
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
      gender: (animal?.gender?.toUpperCase() as "MALE" | "FEMALE") || "MALE",
      weight: animal?.weight?.toString() || "",
      clientId: animal?.client || "", // Use client instead of clientId
      microchipNumber: animal?.microchipNumber || "",
      dateOfBirth: animal?.dateOfBirth
        ? new Date(animal.dateOfBirth).toISOString().split("T")[0]
        : "",
      isSpayedNeutered: animal?.isSpayedNeutered ? "true" : "false",
      spayNeuterDate: animal?.isSpayedNeutered
        ? new Date().toISOString().split("T")[0]
        : "",
    },
  });
  const onSubmit = (data: AnimalFormData) => {
    // Set isSpayedNeutered based on whether spayNeuterDate has a value
    const isSpayedNeutered = !!data.spayNeuterDate;

    onSave({
      name: data.name,
      species: data.species,
      breed: data.breed,
      age: data.age ? parseInt(data.age) : undefined,
      gender: data.gender.toLowerCase() as "male" | "female" | "unknown",
      weight: data.weight ? Number(data.weight) : null,
      client: data.clientId || undefined,
      microchipNumber: data.microchipNumber,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
      isSpayedNeutered: isSpayedNeutered,
      id: animal?.id,
      medicalHistory: animal?.medicalHistory || [],
      createdAt: animal?.createdAt || new Date(),
      updatedAt: new Date(),
    });
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
                name="age"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Age"
                    type="number"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || "")}
                    error={!!errors.age}
                    helperText={errors.age?.message}
                    inputProps={{ min: 0 }}
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
                      errors.dateOfBirth?.message || "Use format MM-DD-YYYY"
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
            </Grid>{" "}
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
                    error={!!errors.spayNeuterDate}
                    helperText={
                      errors.spayNeuterDate?.message ||
                      "Leave empty if not spayed/neutered"
                    }
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

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
  Box,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Animal, Organization } from "../../types/models";

interface OrganizationAnimalFormData {
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed: string;
  age?: string;
  gender: "MALE" | "FEMALE";
  weight: string | null;
  organizationId?: string;
}

interface OrganizationAnimalFormProps {
  animal?: Animal | null;
  organization: Organization;
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
  organizationId: yup.string(),
});

export default function OrganizationAnimalForm({
  animal,
  organization,
  onSave,
  onCancel,
}: OrganizationAnimalFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationAnimalFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: animal?.name || "",
      species: animal?.species || "CAT",
      breed: animal?.breed || "",
      age: animal?.age?.toString() || "",
      gender: (animal?.gender?.toUpperCase() as "MALE" | "FEMALE") || "MALE",
      weight: animal?.weight?.toString() || "",
      organizationId: organization.id,
    },
  });

  const onSubmit = (data: OrganizationAnimalFormData) => {
    onSave({
      name: data.name,
      species: data.species,
      breed: data.breed,
      age: data.age ? parseInt(data.age) : undefined,
      gender: data.gender.toLowerCase() as "male" | "female" | "unknown",
      weight: data.weight ? Number(data.weight) : null,
      organization: organization.id,
      organizationName: organization.name,
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

  return (
    <>
      <DialogTitle id="animal-dialog-title">
        {animal ? "Edit Animal" : `Add New Animal to ${organization.name}`}
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
            </Grid>{" "}
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

export type { OrganizationAnimalFormProps };

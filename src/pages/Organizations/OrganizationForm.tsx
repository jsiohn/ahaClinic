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
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Organization } from "../../types/models";

interface OrganizationFormProps {
  organization?: Organization | null;
  onSave: (data: Partial<Organization>) => void;
  onCancel: () => void;
}

const schema = yup.object().shape({
  name: yup.string().required("Organization name is required"),
  contactPerson: yup.string().required("Contact person is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .matches(
      /^\(\d{3}\) \d{3}-\d{4}$/,
      "Phone number must be in format (XXX) XXX-XXXX"
    )
    .required("Phone number is required"),
  address: yup.string().required("Address is required"),
  status: yup
    .string()
    .oneOf(["ACTIVE", "INACTIVE", "PENDING"])
    .required("Status is required"),
  notes: yup.string(),
});

export default function OrganizationForm({
  organization,
  onSave,
  onCancel,
}: OrganizationFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: organization?.name || "",
      contactPerson: organization?.contactPerson || "",
      email: organization?.email || "",
      phone: organization?.phone || "",
      address: organization?.address || "",
      status: organization?.status || "PENDING",
      notes: organization?.notes || "",
    },
  });

  const onSubmit = (data: any) => {
    onSave({
      ...data,
      id: organization?.id,
      createdAt: organization?.createdAt || new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <>
      <DialogTitle>
        {organization ? "Edit Organization" : "Add New Organization"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Organization Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="contactPerson"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Contact Person"
                  fullWidth
                  error={!!errors.contactPerson}
                  helperText={errors.contactPerson?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone"
                  fullWidth
                  placeholder="(XXX) XXX-XXXX"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel>Status</InputLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Status">
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">
          {organization ? "Save Changes" : "Add Organization"}
        </Button>
      </DialogActions>
    </>
  );
}

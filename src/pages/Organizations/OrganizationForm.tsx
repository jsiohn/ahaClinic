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
import { useEffect } from "react";
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
      /^[\d\s()\-+.]+$/,
      "Phone number can only contain digits, spaces, and characters like (, ), -, +"
    )
    .min(7, "Phone number is too short")
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
  // Check if there's any draft form data in localStorage
  const loadDraftFormData = () => {
    const storedFormData = localStorage.getItem("organizationDraftFormData");
    if (storedFormData) {
      try {
        return JSON.parse(storedFormData);
      } catch (error) {
        console.error("Error parsing draft form data:", error);
        return null;
      }
    }
    return null;
  };

  // Get draft data or use provided organization data
  const draftData = loadDraftFormData();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: draftData?.name || organization?.name || "",
      contactPerson:
        draftData?.contactPerson || organization?.contactPerson || "",
      email: draftData?.email || organization?.email || "",
      phone: draftData?.phone || organization?.phone || "",
      address: draftData?.address || organization?.address || "",
      status: draftData?.status || organization?.status || "PENDING",
      notes: draftData?.notes || organization?.notes || "",
    },
  });

  // Watch form values and save to localStorage as draft
  const formValues = watch();
  useEffect(() => {
    // Save form values to localStorage as they change
    const dialogState = localStorage.getItem("organizationDialogState");
    if (dialogState) {
      // Only save if dialog is supposed to be open
      localStorage.setItem(
        "organizationDraftFormData",
        JSON.stringify(formValues)
      );
    }
  }, [formValues]);
  const onSubmit = (data: any) => {
    try {
      // Clear draft data when submitting
      localStorage.removeItem("organizationDraftFormData");

      onSave({
        ...data,
        id: organization?.id,
        createdAt: organization?.createdAt || new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    }
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
                  helperText={
                    errors.phone?.message || "Enter a valid phone number"
                  }
                  inputProps={{
                    inputMode: "tel",
                  }}
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
      </DialogContent>{" "}
      <DialogActions>
        <Button
          onClick={() => {
            // Clear draft data when canceling
            localStorage.removeItem("organizationDraftFormData");
            onCancel();
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">
          {organization ? "Save Changes" : "Add Organization"}
        </Button>
      </DialogActions>
    </>
  );
}

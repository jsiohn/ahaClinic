import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Autocomplete,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Client } from "../../types/models";

interface BlacklistFormProps {
  client?: Client | null;
  onSave: (data: Partial<Client>) => void;
  onCancel: () => void;
}

// Temporary mock data for client selection - replace with API call
const mockClients: Client[] = [
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "(555) 987-6543",
    address: "456 Normal St, City, State 12345",
    isBlacklisted: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-03-14"),
  },
];

const schema = yup.object().shape({
  clientId: yup.string().required("Client selection is required"),
  blacklistReason: yup
    .string()
    .required("Reason for blacklisting is required")
    .min(10, "Please provide a detailed reason (minimum 10 characters)"),
});

interface BlacklistFormData {
  clientId: string;
  blacklistReason: string;
}

export default function BlacklistForm({
  client,
  onSave,
  onCancel,
}: BlacklistFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BlacklistFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      clientId: client?.id || "",
      blacklistReason: client?.blacklistReason || "",
    },
  });

  const onSubmit = (data: BlacklistFormData) => {
    const selectedClient =
      client || mockClients.find((c) => c.id === data.clientId);
    if (selectedClient) {
      onSave({
        ...selectedClient,
        isBlacklisted: true,
        blacklistReason: data.blacklistReason,
        updatedAt: new Date(),
      });
    }
  };

  const getClientOptionLabel = (option: Client | string) => {
    if (typeof option === "string") return "";
    return `${option.firstName} ${option.lastName} (${option.email})`;
  };

  return (
    <>
      <DialogTitle>
        {client ? "Edit Blacklist Entry" : "Add Client to Blacklist"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {!client && (
            <Grid item xs={12}>
              <Controller
                name="clientId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={mockClients}
                    getOptionLabel={getClientOptionLabel}
                    onChange={(_, newValue) => {
                      onChange(newValue ? newValue.id : "");
                    }}
                    value={mockClients.find((c) => c.id === value) || null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Client"
                        error={!!errors.clientId}
                        helperText={errors.clientId?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
          )}
          {client && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Client: {client.firstName} {client.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {client.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {client.phone}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Controller
              name="blacklistReason"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reason for Blacklisting"
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.blacklistReason}
                  helperText={errors.blacklistReason?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          color="error"
        >
          {client ? "Update Blacklist" : "Add to Blacklist"}
        </Button>
      </DialogActions>
    </>
  );
}

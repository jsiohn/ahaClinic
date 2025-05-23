import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Client } from "../../types/models";
import api from "../../utils/api";

interface BlacklistFormProps {
  client?: Client | null;
  onSave: (data: Partial<Client>) => void;
  onCancel: () => void;
}

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
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await api.get("/clients");

        // Transform and filter out already blacklisted clients
        const transformedData = Array.isArray(response)
          ? response
              .filter((c: any) => !c.isBlacklisted)
              .map((client: any) => ({
                ...client,
                id: client._id || client.id,
                address: client.address || {
                  street: "",
                  city: "",
                  state: "",
                  zipCode: "",
                  country: "",
                },
                createdAt: new Date(client.createdAt),
                updatedAt: new Date(client.updatedAt),
              }))
          : [];

        setClients(transformedData);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!client) {
      fetchClients();
    }
  }, [client]);

  const onSubmit = (data: BlacklistFormData) => {
    const selectedClient =
      client || clients.find((c) => c.id === data.clientId);
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
                    options={clients}
                    getOptionLabel={getClientOptionLabel}
                    onChange={(_, newValue) => {
                      onChange(newValue ? newValue.id : "");
                    }}
                    value={clients.find((c) => c.id === value) || null}
                    loading={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Client"
                        error={!!errors.clientId}
                        helperText={errors.clientId?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
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

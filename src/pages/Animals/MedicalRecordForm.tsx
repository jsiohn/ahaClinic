import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Animal, MedicalRecord } from "../../types/models";

interface MedicalRecordFormProps {
  animal: Animal | null;
  medicalRecord?: MedicalRecord | null; // Add optional medical record for editing
  onSave: (data: Partial<MedicalRecord>) => void;
  onCancel: () => void;
}

const schema = yup.object().shape({
  procedure: yup.string().required("Procedure is required"),
  notes: yup.string().required("Notes are required"),
  veterinarian: yup.string().required("Veterinarian name is required"),
  date: yup.string().required("Date is required"),
});

export default function MedicalRecordForm({
  animal,
  medicalRecord = null, // Default to null for create mode
  onSave,
  onCancel,
}: MedicalRecordFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      procedure: medicalRecord?.procedure || "",
      notes: medicalRecord?.notes || "",
      veterinarian: medicalRecord?.veterinarian || "",
      date: medicalRecord?.date
        ? new Date(medicalRecord.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = (data: any) => {
    if (!animal) return;

    const recordData = {
      ...data,
      animalId: animal.id,
      date: new Date(data.date),
      ...(medicalRecord ? { id: medicalRecord._id || medicalRecord.id } : {}), // Include ID if editing
      ...(medicalRecord
        ? { updatedAt: new Date() }
        : { createdAt: new Date(), updatedAt: new Date() }),
    };

    onSave(recordData);
  };

  if (!animal) {
    return null;
  }

  return (
    <>
      <DialogTitle id="medical-dialog-title">
        {medicalRecord ? "Edit Medical Record" : "Add Medical Record"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Animal: {animal.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Species: {animal.species}
              {animal.breed && ` - ${animal.breed}`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Date"
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
          <Grid item xs={12} md={6}>
            <Controller
              name="veterinarian"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Veterinarian"
                  fullWidth
                  error={!!errors.veterinarian}
                  helperText={errors.veterinarian?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="procedure"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Procedure"
                  fullWidth
                  error={!!errors.procedure}
                  helperText={errors.procedure?.message}
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
                  rows={4}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} tabIndex={0}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          color="primary"
          tabIndex={0}
          type="submit"
        >
          {medicalRecord ? "Update Record" : "Add Record"}
        </Button>
      </DialogActions>
    </>
  );
}

export type { MedicalRecordFormProps };

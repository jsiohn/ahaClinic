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
      procedure: "",
      notes: "",
      veterinarian: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = (data: any) => {
    if (!animal) return;

    onSave({
      ...data,
      animalId: animal.id,
      date: new Date(data.date),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  if (!animal) {
    return null;
  }

  return (
    <>
      <DialogTitle id="medical-dialog-title">Add Medical Record</DialogTitle>
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
          Add Record
        </Button>
      </DialogActions>
    </>
  );
}

export type { MedicalRecordFormProps };

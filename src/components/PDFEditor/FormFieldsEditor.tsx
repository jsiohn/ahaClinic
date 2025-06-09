import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
} from "@mui/material";
import { Description as FormIcon } from "@mui/icons-material";
import { extractFormFields, fillFormFields } from "../../utils/pdfUtils";

interface FormFieldsEditorProps {
  pdfBytes: Uint8Array | null;
  onSave: (updatedPdfBytes: Uint8Array) => void;
}

const FormFieldsEditor: React.FC<FormFieldsEditorProps> = ({
  pdfBytes,
  onSave,
}) => {
  const [formFields, setFormFields] = useState<
    Record<string, { type: string; value: string | boolean | string[] }>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract form fields from PDF
  useEffect(() => {
    if (pdfBytes) {
      const extractFields = async () => {
        try {
          setLoading(true);
          setError(null);
          const fields = await extractFormFields(pdfBytes);
          console.log("PDF Form Fields:", JSON.stringify(fields, null, 2));

          if (Object.keys(fields).length === 0) {
            setError(
              "No interactive form fields found in this PDF. The PDF may need to be recreated with proper form field definitions."
            );
          }

          setFormFields(fields);
        } catch (error) {
          console.error("Error extracting form fields:", error);
          setError(
            "Failed to extract form fields. The PDF may be damaged or may not contain proper form field definitions."
          );
        } finally {
          setLoading(false);
        }
      };

      extractFields();
    }
  }, [pdfBytes]);

  const handleFieldChange = (
    fieldName: string,
    value: string | boolean | string[]
  ) => {
    setFormFields((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
      },
    }));
  };

  const handleSaveFormFields = async () => {
    if (!pdfBytes) return;

    setLoading(true);

    try {
      // Create a record of field values
      const fieldValues: Record<string, string | boolean | string[]> = {};
      Object.entries(formFields).forEach(([fieldName, field]) => {
        fieldValues[fieldName] = field.value;
      });

      // Fill the form fields and get the updated PDF
      const updatedPdfBytes = await fillFormFields(pdfBytes, fieldValues);

      onSave(updatedPdfBytes);
    } catch (error) {
      console.error("Error saving form fields:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (
    fieldName: string,
    field: { type: string; value: string | boolean | string[] }
  ) => {
    switch (field.type) {
      case "text":
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={field.value as string}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            margin="normal"
            size="small"
          />
        );

      case "checkbox":
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={field.value as boolean}
                onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
              />
            }
            label={fieldName}
          />
        );

      case "radio":
        // For simplicity, we'll just use a text field for radio buttons
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={field.value as string}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            margin="normal"
            size="small"
          />
        );

      case "dropdown":
        // For simplicity, we'll just use a text field for dropdowns
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={
              Array.isArray(field.value)
                ? field.value.join(", ")
                : (field.value as string)
            }
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            margin="normal"
            size="small"
          />
        );

      default:
        return (
          <TextField
            fullWidth
            label={fieldName}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            margin="normal"
            size="small"
          />
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <Typography>Loading form fields...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          To make this form interactive, you'll need to recreate the PDF with
          proper form field definitions using software like Adobe Acrobat Pro or
          a similar PDF editor.
        </Typography>
      </Box>
    );
  }

  if (Object.keys(formFields).length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No form fields found in this document. The PDF may need to be
          recreated with interactive form fields.
        </Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">
          <FormIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Form Fields
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveFormFields}
        >
          Save Form
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ maxHeight: "300px", overflow: "auto" }}>
        {Object.entries(formFields).map(([fieldName, field]) => (
          <Box key={fieldName} sx={{ mb: 2 }}>
            {renderFormField(fieldName, field)}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default FormFieldsEditor;

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Grid,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FileUpload as UploadIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  History as HistoryIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import PDFEditor from "../../components/PDFEditor";
import ShareDocumentDialog from "../../components/PDFEditor/ShareDocumentDialog";
import VersionHistoryDialog from "../../components/PDFEditor/VersionHistoryDialog";
import api from "../../utils/api";
import { createPdfUrl, printPdf } from "../../utils/pdfUtils";
import { createMedicalFormTemplate } from "../../utils/createMedicalForm";

interface Document {
  _id: string;
  id: string;
  name: string;
  description: string;
  animal?: {
    _id: string;
    name: string;
  };
  client?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  organization?: {
    _id: string;
    name: string;
  };
  fileType: string;
  isEditable: boolean;
  isPrintable: boolean;
  currentVersion?: number;
  versions?: any[];
  isShared?: boolean;
  shareLink?: string;
  shareLinkExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [animals, setAnimals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [uploading, setUploading] = useState(false);
  // Share document dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Version history dialog state
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [versionHistoryLoading, setVersionHistoryLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchDropdownData();
  }, []);
  const fetchDropdownData = async () => {
    try {
      const [animalsRes, clientsRes, orgsRes] = await Promise.all([
        api.get("/animals"),
        api.get("/clients"),
        api.get("/organizations"),
      ]);

      setAnimals(Array.isArray(animalsRes.data) ? animalsRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setOrganizations(Array.isArray(orgsRes.data) ? orgsRes.data : []);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/documents");
      const documentsData = Array.isArray(response) ? response : [];

      // Transform data for DataGrid
      const transformedDocuments = documentsData.map((doc: any) => ({
        ...doc,
        id: doc._id,
      }));

      setDocuments(transformedDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    setSelectedDocument(null);
    setUploadFile(null);
    setUploadName("");
    setUploadDescription("");
    setSelectedAnimal("");
    setSelectedClient("");
    setSelectedOrganization("");
    setOpenDialog(true);
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadName) {
        setUploadName(file.name);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setError("Please select a PDF file to upload");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName || uploadFile.name);
      formData.append("description", uploadDescription);

      if (selectedAnimal) {
        formData.append("animal", selectedAnimal);
      }

      if (selectedClient) {
        formData.append("client", selectedClient);
      }

      if (selectedOrganization) {
        formData.append("organization", selectedOrganization);
      }

      await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setOpenDialog(false);
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      setError("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };
  const handleViewDocument = async (document: Document) => {
    try {
      setPdfLoading(true);
      setSelectedDocument(document);

      // Fetch the PDF file data
      const response = await api.get(`/documents/${document._id}/file`, {
        responseType: "arraybuffer",
      });

      // Convert array buffer to Uint8Array
      const pdfData = new Uint8Array(response.data);
      setPdfBytes(pdfData);

      setOpenViewDialog(true);
    } catch (error) {
      console.error("Error fetching document file:", error);
      setError("Failed to fetch document file");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      await api.delete(`/documents/${document._id}`);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Failed to delete document");
    }
  };

  const handleSaveEditedPdf = async (editedPdfBytes: Uint8Array) => {
    if (!selectedDocument) return;

    try {
      setUploading(true);

      // Create a new File object from the edited PDF bytes
      const editedPdfBlob = new Blob([editedPdfBytes], {
        type: "application/pdf",
      });
      const editedPdfFile = new File([editedPdfBlob], selectedDocument.name, {
        type: "application/pdf",
      });

      const formData = new FormData();
      formData.append("file", editedPdfFile);

      // Update the document with the edited PDF
      await api.put(`/documents/${selectedDocument._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the displayed PDF
      setPdfBytes(editedPdfBytes);
    } catch (error) {
      console.error("Error saving edited PDF:", error);
      setError("Failed to save edited PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedDocument(null);
    setPdfBytes(null);
  };

  const handleCloseUploadDialog = () => {
    setOpenDialog(false);
  };
  const handlePrintDocument = async (document: Document) => {
    try {
      setPdfLoading(true);

      // Fetch the PDF file data
      const response = await api.get(`/documents/${document._id}/file`, {
        responseType: "arraybuffer",
      });

      // Convert array buffer to Uint8Array
      const pdfData = new Uint8Array(response.data);

      // Create a URL for the PDF
      const url = createPdfUrl(pdfData);

      // Print the PDF
      printPdf(url);

      // Clean up the URL after printing
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (error) {
      console.error("Error printing document:", error);
      setError("Failed to print document");
    } finally {
      setPdfLoading(false);
    }
  };

  // Filter documents based on search term
  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true;

    const searchStr = searchTerm.toLowerCase();
    const docName = doc.name.toLowerCase();
    const docDesc = doc.description?.toLowerCase() || "";
    const clientName = doc.client
      ? `${doc.client.firstName} ${doc.client.lastName}`.toLowerCase()
      : "";
    const animalName = doc.animal ? doc.animal.name.toLowerCase() : "";
    const orgName = doc.organization ? doc.organization.name.toLowerCase() : "";

    return (
      docName.includes(searchStr) ||
      docDesc.includes(searchStr) ||
      clientName.includes(searchStr) ||
      animalName.includes(searchStr) ||
      orgName.includes(searchStr)
    );
  });
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PdfIcon fontSize="small" />
          {params.value}
        </Box>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      width: 250,
    },
    {
      field: "client",
      headerName: "Client",
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const clientName = params.row.client
          ? `${params.row.client.firstName} ${params.row.client.lastName}`
          : "";
        return <span>{clientName}</span>;
      },
    },
    {
      field: "animal",
      headerName: "Animal",
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const animalName = params.row.animal ? params.row.animal.name : "";
        return <span>{animalName}</span>;
      },
    },
    {
      field: "organization",
      headerName: "Organization",
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const orgName = params.row.organization
          ? params.row.organization.name
          : "";
        return <span>{orgName}</span>;
      },
    },
    {
      field: "currentVersion",
      headerName: "Version",
      width: 80,
      renderCell: (params: GridRenderCellParams) => {
        return <span>v{params.value || 1}</span>;
      },
    },
    {
      field: "updatedAt",
      headerName: "Last Updated",
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        const date = new Date(params.value);
        return <span>{date.toLocaleString()}</span>;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 240,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="View & Edit">
            <IconButton
              size="small"
              onClick={() => handleViewDocument(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton
              size="small"
              onClick={() => handlePrintDocument(params.row)}
              color="primary"
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Version History">
            <IconButton
              size="small"
              onClick={() => handleViewVersionHistory(params.row)}
              color="secondary"
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Document">
            <IconButton
              size="small"
              onClick={() => handleShareDocument(params.row)}
              color="info"
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDeleteDocument(params.row)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Function to open the version history dialog
  const handleViewVersionHistory = async (document: Document) => {
    try {
      setVersionHistoryLoading(true);
      setSelectedDocument(document);
      setVersionHistoryOpen(true);

      // Fetch version history
      const response = await api.get(`/documents/${document._id}/versions`);
      if (Array.isArray(response.data)) {
        setVersionHistory(response.data);
      } else {
        setVersionHistory([]);
      }
    } catch (error) {
      console.error("Error fetching version history:", error);
      setError("Failed to fetch version history");
      setVersionHistory([]);
    } finally {
      setVersionHistoryLoading(false);
    }
  };

  // Function to view a specific version
  const handleViewVersion = async (versionNumber: number) => {
    if (!selectedDocument) return;

    try {
      setPdfLoading(true);

      // Fetch the specific version
      const response = await api.get(
        `/documents/${selectedDocument._id}/version/${versionNumber}`,
        { responseType: "arraybuffer" }
      );

      // Convert array buffer to Uint8Array
      const pdfData = new Uint8Array(response.data);
      setPdfBytes(pdfData);

      setVersionHistoryOpen(false);
      setOpenViewDialog(true);
    } catch (error) {
      console.error("Error fetching version:", error);
      setError("Failed to fetch version");
    } finally {
      setPdfLoading(false);
    }
  };

  // Function to restore a specific version
  const handleRestoreVersion = async (versionNumber: number) => {
    if (!selectedDocument) return;

    try {
      setVersionHistoryLoading(true);

      // API call to restore to a specific version
      await api.post(
        `/documents/${selectedDocument._id}/restore/${versionNumber}`
      );

      // Refresh document list
      await fetchDocuments();

      // Close the dialog
      setVersionHistoryOpen(false);
      setError(null);

      // Show success message
      setError("Document restored to version " + versionNumber);
    } catch (error) {
      console.error("Error restoring version:", error);
      setError("Failed to restore version");
    } finally {
      setVersionHistoryLoading(false);
    }
  };

  // Function to open the share dialog
  const handleShareDocument = (document: Document) => {
    setSelectedDocument(document);
    setShareDialogOpen(true);
  };

  const handleCreateBlankForm = async () => {
    try {
      setUploading(true);

      // Generate a blank medical form template
      const blankFormBytes = await createMedicalFormTemplate();

      // Create a Blob and File from the bytes
      const blankFormBlob = new Blob([blankFormBytes], {
        type: "application/pdf",
      });
      const blankFormFile = new File(
        [blankFormBlob],
        "Blank Medical Form.pdf",
        { type: "application/pdf" }
      );

      // Create FormData
      const formData = new FormData();
      formData.append("file", blankFormFile);
      formData.append("name", "Blank Medical Form");
      formData.append(
        "description",
        "A blank medical form template that can be filled out"
      );

      if (selectedAnimal) {
        formData.append("animal", selectedAnimal);
      }

      if (selectedClient) {
        formData.append("client", selectedClient);
      }

      if (selectedOrganization) {
        formData.append("organization", selectedOrganization);
      }

      // Upload to server
      await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setOpenDialog(false);
      fetchDocuments();
    } catch (error) {
      console.error("Error creating blank form:", error);
      setError("Failed to create blank form");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h1">
          Documents
        </Typography>{" "}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleUploadClick}
          >
            Upload Document
          </Button>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={handleCreateBlankForm}
          >
            Create Form
          </Button>
        </Box>
      </Box>
      <DataGrid
        rows={filteredDocuments}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "updatedAt", sort: "desc" }],
          },
        }}
        pageSizeOptions={[10, 20, 50]}
        checkboxSelection={false}
        disableRowSelectionOnClick
        loading={loading}
        sx={{ minHeight: 500 }}
      />
      {/* Upload Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseUploadDialog}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2">
              Upload Document
            </Typography>
            <IconButton onClick={handleCloseUploadDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  mb: 3,
                  cursor: "pointer",
                }}
                onClick={handleFileSelect}
              >
                <UploadIcon
                  sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                />
                <Typography variant="h6" gutterBottom>
                  {uploadFile ? uploadFile.name : "Select PDF to Upload"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click to browse or drag and drop your PDF file here
                </Typography>
                <input
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Document Name"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  label="Client"
                >
                  <MenuItem value="">None</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>
                      {client.firstName} {client.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Animal</InputLabel>
                <Select
                  value={selectedAnimal}
                  onChange={(e) => setSelectedAnimal(e.target.value)}
                  label="Animal"
                >
                  <MenuItem value="">None</MenuItem>
                  {animals.map((animal) => (
                    <MenuItem key={animal._id} value={animal._id}>
                      {animal.name} ({animal.species})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Organization</InputLabel>
                <Select
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                  label="Organization"
                >
                  <MenuItem value="">None</MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org._id} value={org._id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button onClick={handleCloseUploadDialog} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUploadSubmit}
              disabled={!uploadFile || uploading}
              startIcon={
                uploading ? <CircularProgress size={20} /> : <UploadIcon />
              }
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </Box>
        </Box>
      </Dialog>
      {/* View/Edit Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2">
              {selectedDocument?.name}
            </Typography>
            <IconButton onClick={handleCloseViewDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {pdfLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "70vh",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: "70vh" }}>
              <PDFEditor pdfBytes={pdfBytes} onSave={handleSaveEditedPdf} />
            </Box>
          )}
        </Box>
      </Dialog>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>{" "}
      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        documentName={selectedDocument?.name || ""}
        versions={versionHistory}
        currentVersion={selectedDocument?.currentVersion || 1}
        onRestoreVersion={handleRestoreVersion}
        onViewVersion={handleViewVersion}
        loading={versionHistoryLoading}
      />
      {/* Share Document Dialog */}
      <ShareDocumentDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        documentId={selectedDocument?._id || null}
        documentName={selectedDocument?.name || ""}
      />
    </Box>
  );
}

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Slider,
  Typography,
  Paper,
  CircularProgress,
  Tooltip,
  Dialog,
} from "@mui/material";
import {
  TextFields as TextIcon,
  Brush as DrawIcon,
  Create as SignatureIcon,
  Highlight as HighlightIcon,
  Delete as EraseIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Description as FormIcon,
} from "@mui/icons-material";
import { Document, Page, pdfjs } from "react-pdf";
import * as fabric from "fabric";
import { PDFDocument } from "pdf-lib";
import {
  createPdfUrl,
  printPdf,
  extractFormFields,
} from "../../utils/pdfUtils";
import FormFieldsEditor from "./FormFieldsEditor";

// Set the PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFEditorProps {
  pdfBytes: Uint8Array | null;
  onSave?: (editedPdfBytes: Uint8Array) => void;
}

type EditorMode = "text" | "draw" | "highlight" | "signature" | "erase";

const PDFEditor: React.FC<PDFEditorProps> = ({ pdfBytes, onSave }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<EditorMode>("text");
  const [textInput, setTextInput] = useState("");
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16); // Form fields state is now managed by FormFieldsEditor
  const [showFormFields, setShowFormFields] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Initialize PDF viewer
  useEffect(() => {
    if (pdfBytes) {
      const url = createPdfUrl(pdfBytes);
      setPdfUrl(url);

      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [pdfBytes]);

  // Initialize Fabric.js canvas for annotations
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: mode === "draw",
      });

      // Set up drawing brush
      if (fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush.color = color;
        fabricCanvasRef.current.freeDrawingBrush.width = 3;
      }
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Update canvas mode
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDrawingMode = mode === "draw";

      // Handle selection mode
      if (mode === "erase") {
        fabricCanvasRef.current.selection = true;
      } else {
        fabricCanvasRef.current.selection = false;
      }
    }
  }, [mode]);

  // Update drawing brush color
  useEffect(() => {
    if (fabricCanvasRef.current && fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
  }, [color]);
  // Check for form fields to show dialog
  useEffect(() => {
    if (pdfBytes) {
      const checkForFields = async () => {
        try {
          const fields = await extractFormFields(pdfBytes);
          if (Object.keys(fields).length > 0) {
            setShowFormFields(true);
          }
        } catch (error) {
          console.error("Error checking for form fields:", error);
        }
      };

      checkForFields();
    }
  }, [pdfBytes]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1));
  };

  const handleModeChange = (newMode: EditorMode) => {
    setMode(newMode);
  };

  const handleZoomChange = (_event: Event, newValue: number | number[]) => {
    setZoom(newValue as number);
  };

  const handleAddText = () => {
    if (fabricCanvasRef.current && textInput) {
      const text = new fabric.Text(textInput, {
        left: 100,
        top: 100,
        fontSize,
        fill: color,
      });
      fabricCanvasRef.current.add(text);
      fabricCanvasRef.current.setActiveObject(text);
      setTextInput("");
    }
  };

  const handleAddSignature = () => {
    const signatureCanvas = document.createElement("canvas");
    signatureCanvas.width = 500;
    signatureCanvas.height = 200;

    const signatureCtx = signatureCanvas.getContext("2d");
    if (signatureCtx) {
      signatureCtx.fillStyle = "white";
      signatureCtx.fillRect(
        0,
        0,
        signatureCanvas.width,
        signatureCanvas.height
      );

      // Draw a prompt text
      signatureCtx.font = "20px Arial";
      signatureCtx.fillStyle = "#888888";
      signatureCtx.fillText("Sign here", 150, 100);
    }

    // Create a popup with the signature canvas
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "white";
    popup.style.padding = "20px";
    popup.style.borderRadius = "5px";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    popup.style.zIndex = "10000";

    const title = document.createElement("h3");
    title.textContent = "Draw your signature";
    popup.appendChild(title);

    popup.appendChild(signatureCanvas);

    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "10px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-between";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.onclick = () => {
      document.body.removeChild(popup);
    };

    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Add Signature";
    confirmButton.onclick = () => {
      if (fabricCanvasRef.current) {
        fabric.Image.fromURL(
          signatureCanvas.toDataURL(),
          (img: fabric.Image) => {
            img.scaleToWidth(200);
            fabricCanvasRef.current?.add(img);
            fabricCanvasRef.current?.setActiveObject(img);
          }
        );
      }
      document.body.removeChild(popup);
    };

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    popup.appendChild(buttonContainer);

    document.body.appendChild(popup);

    // Set up drawing on the signature canvas
    let isDrawing = false;

    signatureCanvas.onmousedown = (e) => {
      isDrawing = true;
      const rect = signatureCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (signatureCtx) {
        signatureCtx.beginPath();
        signatureCtx.moveTo(x, y);
        signatureCtx.lineWidth = 2;
        signatureCtx.strokeStyle = "black";
      }
    };

    signatureCanvas.onmousemove = (e) => {
      if (isDrawing && signatureCtx) {
        const rect = signatureCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        signatureCtx.lineTo(x, y);
        signatureCtx.stroke();
      }
    };

    signatureCanvas.onmouseup = () => {
      isDrawing = false;
    };

    signatureCanvas.onmouseleave = () => {
      isDrawing = false;
    };
  };

  const handleHighlight = () => {
    if (fabricCanvasRef.current) {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 30,
        fill: "yellow",
        opacity: 0.3,
        selectable: true,
      });
      fabricCanvasRef.current.add(rect);
      fabricCanvasRef.current.setActiveObject(rect);
    }
  };

  const handleDeleteSelected = () => {
    if (fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject) {
        fabricCanvasRef.current.remove(activeObject);
      }
    }
  };

  const handleSavePDF = async () => {
    if (!pdfBytes || !fabricCanvasRef.current) return;

    setIsLoading(true);

    try {
      // First, create a data URL from the canvas
      const canvasDataUrl = fabricCanvasRef.current.toDataURL({
        format: "png",
        quality: 1,
      });

      // Convert data URL to ArrayBuffer
      const base64Data = canvasDataUrl.split(",")[1];
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Load the original PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Embed the annotation image
      const annotationImage = await pdfDoc.embedPng(bytes);

      // Get the page
      const pages = pdfDoc.getPages();
      if (pageNumber <= pages.length) {
        const page = pages[pageNumber - 1];
        const { width, height } = page.getSize();

        // Draw the annotation image on the page
        page.drawImage(annotationImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();

      if (onSave) {
        onSave(modifiedPdfBytes);
      }

      // Update the displayed PDF
      const newUrl = createPdfUrl(modifiedPdfBytes);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(newUrl);
    } catch (error) {
      console.error("Error saving PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPDF = () => {
    if (pdfUrl) {
      printPdf(pdfUrl);
    }
  };
  // Form field management is handled by FormFieldsEditor component

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <ButtonGroup variant="outlined">
          <Tooltip title="Add Text">
            <Button
              onClick={() => handleModeChange("text")}
              color={mode === "text" ? "primary" : "inherit"}
            >
              <TextIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Draw">
            <Button
              onClick={() => handleModeChange("draw")}
              color={mode === "draw" ? "primary" : "inherit"}
            >
              <DrawIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Highlight">
            <Button
              onClick={() => handleModeChange("highlight")}
              color={mode === "highlight" ? "primary" : "inherit"}
            >
              <HighlightIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Add Signature">
            <Button
              onClick={() => handleModeChange("signature")}
              color={mode === "signature" ? "primary" : "inherit"}
            >
              <SignatureIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Erase">
            <Button
              onClick={() => handleModeChange("erase")}
              color={mode === "erase" ? "primary" : "inherit"}
            >
              <EraseIcon />
            </Button>
          </Tooltip>
        </ButtonGroup>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 100 }}>
            <Typography id="zoom-slider" gutterBottom>
              Zoom: {zoom}x
            </Typography>
            <Slider
              value={zoom}
              onChange={handleZoomChange}
              aria-labelledby="zoom-slider"
              step={0.1}
              min={0.5}
              max={2}
            />
          </Box>

          <ButtonGroup variant="outlined">
            <Tooltip title="Save PDF">
              <Button onClick={handleSavePDF}>
                <SaveIcon />
              </Button>
            </Tooltip>
            <Tooltip title="Print PDF">
              <Button onClick={handlePrintPDF}>
                <PrintIcon />
              </Button>
            </Tooltip>
          </ButtonGroup>
        </Box>
      </Paper>

      {/* Mode-specific controls */}
      {mode === "text" && (
        <Paper
          sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}
        >
          <Typography variant="body1">Text:</Typography>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            style={{ flex: 1, padding: "8px" }}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <Typography variant="body2">Size: {fontSize}px</Typography>{" "}
          <Slider
            value={fontSize}
            onChange={(_, value) => setFontSize(value as number)}
            step={1}
            min={10}
            max={36}
            sx={{ width: 100 }}
          />
          <Button variant="contained" onClick={handleAddText}>
            Add Text
          </Button>
        </Paper>
      )}

      {mode === "draw" && (
        <Paper
          sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}
        >
          <Typography variant="body1">Draw color:</Typography>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </Paper>
      )}

      {mode === "highlight" && (
        <Paper
          sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}
        >
          <Button variant="contained" onClick={handleHighlight}>
            Add Highlight
          </Button>
        </Paper>
      )}

      {mode === "signature" && (
        <Paper
          sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}
        >
          <Button variant="contained" onClick={handleAddSignature}>
            Add Signature
          </Button>
        </Paper>
      )}

      {mode === "erase" && (
        <Paper
          sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}
        >
          <Typography variant="body1">
            Select an object to delete it.
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelected}
          >
            Delete Selected
          </Button>
        </Paper>
      )}

      {/* PDF viewer and canvas overlay */}
      <Box
        ref={canvasContainerRef}
        sx={{
          position: "relative",
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          bgcolor: "#f5f5f5",
          border: "1px solid #e0e0e0",
          borderRadius: 1,
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : pdfUrl ? (
          <Box sx={{ position: "relative" }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<CircularProgress />}
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={595.28 * zoom} // A4 width in points
                height={841.89 * zoom} // A4 height in points
              />
            </Document>

            {/* Canvas overlay for annotations */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
              }}
            >
              <canvas
                ref={canvasRef}
                width={595.28 * zoom}
                height={841.89 * zoom}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "auto",
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No PDF to display
            </Typography>
          </Box>
        )}
      </Box>

      {/* Page navigation */}
      {numPages && numPages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 2,
            gap: 2,
          }}
        >
          <Button
            disabled={pageNumber <= 1}
            onClick={handlePrevPage}
            variant="outlined"
          >
            Previous
          </Button>
          <Typography variant="body1">
            Page {pageNumber} of {numPages}
          </Typography>
          <Button
            disabled={pageNumber >= numPages}
            onClick={handleNextPage}
            variant="outlined"
          >
            Next
          </Button>
        </Box>
      )}

      {/* Form fields editor button */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FormIcon />}
          onClick={() => setShowFormFields(!showFormFields)}
        >
          {showFormFields ? "Hide Form Fields" : "Edit Form Fields"}
        </Button>
      </Box>

      {/* Form fields dialog */}
      <Dialog
        open={showFormFields}
        onClose={() => setShowFormFields(false)}
        maxWidth="md"
        fullWidth
      >
        <FormFieldsEditor
          pdfBytes={pdfBytes}
          onSave={(updatedPdfBytes) => {
            if (onSave) {
              onSave(updatedPdfBytes);
            }

            // Update the displayed PDF
            const newUrl = createPdfUrl(updatedPdfBytes);
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            setPdfUrl(newUrl);

            setShowFormFields(false);
          }}
        />
      </Dialog>
    </Box>
  );
};

export default PDFEditor;

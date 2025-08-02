import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Invoice } from "../types/models";

/**
 * Generates a PDF from invoice data using pdf-lib
 */
interface PopulatedInvoice extends Invoice {
  client?: {
    firstName: string;
    lastName: string;
  };
  animals?: {
    name: string;
    species: string;
  }[];
}

export const generateInvoicePdf = async (
  invoice: Invoice | PopulatedInvoice
): Promise<Uint8Array> => {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Add standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Company info
    page.drawText("AHA Clinic", {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Veterinary Services", {
      x: 50,
      y: height - 80,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Draw a line separator
    page.drawLine({
      start: { x: 50, y: height - 100 },
      end: { x: width - 50, y: height - 100 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Invoice details
    page.drawText(`INVOICE #${invoice.invoiceNumber || "N/A"}`, {
      x: 50,
      y: height - 140,
      size: 16,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    const invoiceDate = invoice.date
      ? new Date(invoice.date).toLocaleDateString()
      : "N/A";
    const dueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString()
      : "N/A";

    page.drawText(`Date: ${invoiceDate}`, {
      x: 50,
      y: height - 170,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Due Date: ${dueDate}`, {
      x: 50,
      y: height - 190,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Status: ${invoice.status || "N/A"}`, {
      x: 50,
      y: height - 210,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Payment information (right-aligned)
    if (invoice.status === "paid") {
      page.drawText("PAID", {
        x: width - 150,
        y: height - 140,
        size: 20,
        font: boldFont,
        color: rgb(0, 0.5, 0),
      });

      if (invoice.paymentDate) {
        page.drawText(
          `Payment Date: ${invoice.paymentDate.toLocaleDateString()}`,
          {
            x: width - 200,
            y: height - 170,
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
          }
        );
      }

      if (invoice.paymentMethod) {
        const paymentMethodDisplay = invoice.paymentMethod
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        page.drawText(`Payment Method: ${paymentMethodDisplay}`, {
          x: width - 200,
          y: height - 190,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    }

    // Client information
    const clientName =
      "client" in invoice && invoice.client
        ? `${invoice.client.firstName || ""} ${
            invoice.client.lastName || ""
          }`.trim()
        : "Client information not available";

    // Animal information
    const animalInfo =
      "animals" in invoice && invoice.animals && invoice.animals.length > 0
        ? invoice.animals
            .map(
              (animal) =>
                `${animal.name || "Unknown"} (${animal.species || "Unknown"})`
            )
            .join(", ")
        : "Animal information not available";

    // Client and Animal details
    let yPos = height - 250;
    page.drawText("Client Information:", {
      size: 12,
      x: 50,
      y: yPos,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    yPos -= 20;
    page.drawText(clientName, {
      size: 10,
      x: 70,
      y: yPos,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    yPos -= 40;
    page.drawText("Animal Information:", {
      size: 12,
      x: 50,
      y: yPos,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    yPos -= 20;
    page.drawText(animalInfo, {
      size: 10,
      x: 70,
      y: yPos,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Draw items header
    const itemsY = height - 350;
    page.drawRectangle({
      x: 50,
      y: itemsY - 20,
      width: width - 100,
      height: 20,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText("Item", {
      x: 60,
      y: itemsY - 5,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Description", {
      x: 180,
      y: itemsY - 5,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Qty", {
      x: 350,
      y: itemsY - 5,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Unit Price", {
      x: 400,
      y: itemsY - 5,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Total", {
      x: 500,
      y: itemsY - 5,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Draw items
    let currentY = itemsY - 40;
    const itemHeight = 40;

    if (invoice.animalSections && invoice.animalSections.length > 0) {
      // Iterate through animal sections
      invoice.animalSections.forEach((section) => {
        // Draw animal header if animal info is available
        if (section.animalId && typeof section.animalId === "object") {
          const animal = section.animalId as any;
          page.drawText(
            `Animal: ${animal.name || "Unknown"} (${
              animal.species || "Unknown"
            })`,
            {
              x: 60,
              y: currentY,
              size: 12,
              font: boldFont,
              color: rgb(0.1, 0.1, 0.1),
            }
          );
          currentY -= 25;
        }

        // Draw items for this animal
        section.items.forEach((item) => {
          // Draw item details
          page.drawText(item.procedure || "", {
            x: 60,
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });

          // Description with word wrap
          const description = item.description || "";
          const descriptionLines = wrapText(description, 25);
          descriptionLines.forEach((line, i) => {
            page.drawText(line, {
              x: 180,
              y: currentY - i * 12,
              size: 9,
              font,
              color: rgb(0.3, 0.3, 0.3),
            });
          });

          // Quantity
          page.drawText(item.quantity?.toString() || "1", {
            x: 350,
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });

          // Unit Price
          page.drawText(`$${Number(item.unitPrice || 0).toFixed(2)}`, {
            x: 400,
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });

          // Total
          page.drawText(`$${Number(item.total || 0).toFixed(2)}`, {
            x: 500,
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });

          // Adjust y position for next item
          currentY -= itemHeight;

          // Add a page if we're running out of space
          if (currentY < 100) {
            page.drawText("Continued on next page...", {
              x: width / 2 - 60,
              y: 50,
              size: 10,
              font: boldFont,
              color: rgb(0.3, 0.3, 0.3),
            });
            // Add a new page
            page = pdfDoc.addPage([595.28, 841.89]);
            currentY = height - 50;

            // Add header to new page
            page.drawText(`INVOICE #${invoice.invoiceNumber} (continued)`, {
              x: 50,
              y: height - 50,
              size: 16,
              font: boldFont,
              color: rgb(0.1, 0.1, 0.1),
            });
          }
        });

        // Add spacing between animal sections
        currentY -= 20;
      });
    } else {
      page.drawText("No items in this invoice", {
        x: 60,
        y: currentY,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      currentY -= 20;
    }

    // Draw totals
    const totalsY = Math.max(100, currentY - 60);

    page.drawLine({
      start: { x: 350, y: totalsY + 20 },
      end: { x: width - 50, y: totalsY + 20 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Subtotal:", {
      x: 400,
      y: totalsY,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`$${invoice.subtotal?.toFixed(2)}`, {
      x: 500,
      y: totalsY,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawLine({
      start: { x: 350, y: totalsY - 10 },
      end: { x: width - 50, y: totalsY - 10 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Total:", {
      x: 400,
      y: totalsY - 30,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`$${invoice.total?.toFixed(2)}`, {
      x: 500,
      y: totalsY - 30,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Add footer
    page.drawText(
      "Thank you for choosing AHA Clinic for your pet care needs!",
      {
        x: width / 2 - 150,
        y: 50,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      }
    );
    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Helper function to wrap text
 */
function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let currentLine = "";

  const words = text.split(" ");
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxChars) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

/**
 * Generates a PDF from an HTML element using html2canvas and jsPDF
 */
export const generatePdfFromElement = async (
  elementId: string,
  fileName: string
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 295; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add new pages if the content exceeds a single page
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
};

/**
 * Loads and modifies an existing PDF file
 */
export const editPdfFile = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Register fontkit to support custom fonts
  pdfDoc.registerFontkit(fontkit);

  // Example: Add a "MODIFIED" watermark to the first page
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  firstPage.drawText("MODIFIED", {
    x: width / 2 - 50,
    y: height / 2,
    size: 50,
    font,
    color: rgb(0.95, 0.1, 0.1),
    opacity: 0.3,
  });

  // Return the modified PDF
  return await pdfDoc.save();
};

/**
 * Extract all form fields from a PDF document with their types and values
 */
export const extractFormFields = async (
  bytes: Uint8Array
): Promise<
  Record<string, { type: string; value: string | boolean | string[] }>
> => {
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  const result: Record<
    string,
    { type: string; value: string | boolean | string[] }
  > = {};

  for (const field of fields) {
    const fieldName = field.getName();
    let fieldType = "unknown";
    let fieldValue: string | boolean | string[] = "";

    // Check field type and extract value
    try {
      // Check if field is a text field
      try {
        const textField = form.getTextField(fieldName);
        fieldType = "text";
        fieldValue = textField.getText() || "";
        result[fieldName] = { type: fieldType, value: fieldValue };
        continue;
      } catch (e) {
        // Not a text field, continue checking other types
      }

      // Check if field is a checkbox
      try {
        const checkBox = form.getCheckBox(fieldName);
        fieldType = "checkbox";
        fieldValue = checkBox.isChecked();
        result[fieldName] = { type: fieldType, value: fieldValue };
        continue;
      } catch (e) {
        // Not a checkbox, continue checking other types
      }

      // Check if field is a radio group
      try {
        const radioGroup = form.getRadioGroup(fieldName);
        fieldType = "radio";
        fieldValue = radioGroup.getSelected() || "";
        result[fieldName] = { type: fieldType, value: fieldValue };
        continue;
      } catch (e) {
        // Not a radio group, continue checking other types
      }

      // Check if field is a dropdown
      try {
        const dropdown = form.getDropdown(fieldName);
        fieldType = "dropdown";
        fieldValue = dropdown.getSelected();
        result[fieldName] = { type: fieldType, value: fieldValue };
        continue;
      } catch (e) {
        // Not a dropdown, continue checking other types
      } // If we couldn't determine the type, add as unknown
      result[fieldName] = { type: "unknown", value: "" };
    } catch (error) {
      result[fieldName] = { type: "error", value: "" };
    }
  }

  return result;
};

/**
 * Fill a PDF form with provided data and return the updated PDF bytes
 */
export const fillFormFields = async (
  bytes: Uint8Array,
  fieldData: Record<string, string | boolean | string[]>
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();

  // Fill in each field with provided data
  for (const [fieldName, value] of Object.entries(fieldData)) {
    try {
      // Determine field type and set value accordingly
      try {
        const textField = form.getTextField(fieldName);
        if (typeof value === "string") {
          textField.setText(value);
        }
        continue;
      } catch (e) {
        // Not a text field, try another type
      }

      try {
        const checkBox = form.getCheckBox(fieldName);
        if (typeof value === "boolean") {
          if (value) {
            checkBox.check();
          } else {
            checkBox.uncheck();
          }
        }
        continue;
      } catch (e) {
        // Not a checkbox, try another type
      }

      try {
        const radioGroup = form.getRadioGroup(fieldName);
        if (typeof value === "string") {
          radioGroup.select(value);
        }
        continue;
      } catch (e) {
        // Not a radio group, try another type
      }

      try {
        const dropdown = form.getDropdown(fieldName);
        if (Array.isArray(value)) {
          dropdown.select(value);
        } else if (typeof value === "string") {
          dropdown.select([value]);
        }
        continue;
      } catch (e) {
        // Not a dropdown, no more types to try
      }
    } catch (error) {
      // Silently continue if field cannot be filled
    }
  }

  // Return the updated PDF
  return await pdfDoc.save();
};

/**
 * Make a PDF document editable by flattening existing form fields
 * and preparing it for annotation
 */
export const makeEditable = async (bytes: Uint8Array): Promise<Uint8Array> => {
  try {
    const pdfDoc = await PDFDocument.load(bytes);

    // Check if the document has form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // If the document has form fields, flatten them to make them part of the content
    if (fields.length > 0) {
      form.flatten();
    } // Save the editable version
    return await pdfDoc.save();
  } catch (error) {
    return bytes; // Return original if there was an error
  }
};

/**
 * Convert PDF bytes to a Blob object
 */
export const pdfBytesToBlob = (bytes: Uint8Array): Blob => {
  return new Blob([bytes], { type: "application/pdf" });
};

/**
 * Create a download URL for a PDF
 */
export const createPdfUrl = (bytes: Uint8Array): string => {
  const blob = pdfBytesToBlob(bytes);
  return URL.createObjectURL(blob);
};

/**
 * Print a PDF using a hidden iframe
 */
export const printPdf = (pdfUrl: string): void => {
  // First try opening in a new window for printing
  const printWindow = window.open(pdfUrl, "_blank");

  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        try {
          printWindow.print();
          // Don't close the window immediately - let the user handle it
          // The user can close it after printing is complete
        } catch (error) {
          printWindow.close();
          // Fallback to iframe method
          printWithIframe(pdfUrl);
        }
      }, 1000); // Increased timeout for better PDF loading
    };

    // Handle case where window doesn't load (e.g., PDF plugin issues)
    setTimeout(() => {
      if (printWindow.closed) {
        printWithIframe(pdfUrl);
      }
    }, 3000);
  } else {
    // Fallback to iframe method if popup blocked
    printWithIframe(pdfUrl);
  }
};

/**
 * Fallback print method using iframe
 */
const printWithIframe = (pdfUrl: string): void => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = pdfUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.print();
        } else {
          downloadPdf(pdfUrl);
        }
      }, 1500); // Increased timeout for better PDF loading
    } catch (error) {
      // Last resort: download the PDF
      downloadPdf(pdfUrl);
    }

    // Remove the iframe after printing (with longer delay)
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  };
  iframe.onerror = () => {
    // Remove failed iframe
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    // Try download as fallback
    downloadPdf(pdfUrl);
  };
};

/**
 * Download the PDF as a fallback when printing fails
 */
const downloadPdf = (pdfUrl: string): void => {
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = "invoice.pdf";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

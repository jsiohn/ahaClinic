import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { InvoiceItem } from "../types/models";

/**
 * Generates a PDF from invoice data using pdf-lib
 */
interface PopulatedInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: Date;
  dueDate: Date;
  subtotal: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "credit_card" | "bank_transfer" | "check" | null;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  client?: {
    firstName?: string;
    lastName?: string;
    name?: string; // For organizations
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      county?: string;
    };
  };
  animalSections: {
    animalId: string;
    animal?: {
      name: string;
      species: string;
    };
    items: InvoiceItem[];
    subtotal: number;
  }[];
}

export const generateInvoicePdf = async (
  invoice: PopulatedInvoice
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

    // Client information - handle both clients and organizations
    const clientName =
      "client" in invoice && invoice.client
        ? invoice.client.firstName && invoice.client.lastName
          ? `${invoice.client.firstName} ${invoice.client.lastName}`.trim()
          : invoice.client.name || "Unknown Client"
        : "Client information not available";

    // Animal information
    const animalInfo =
      invoice.animalSections && invoice.animalSections.length > 0
        ? invoice.animalSections
            .map((section) => {
              const animal = section.animal;
              return animal
                ? `${animal.name || "Unknown"} (${animal.species || "Unknown"})`
                : "Animal information not available";
            })
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

    // Add client address if available
    if ("client" in invoice && invoice.client?.address) {
      const address = invoice.client.address;
      yPos -= 15;

      // Build address lines
      const addressLines: string[] = [];

      if (address.street) {
        addressLines.push(address.street);
      }

      const cityStateZip = [address.city, address.state, address.zipCode]
        .filter(Boolean)
        .join(", ");

      if (cityStateZip) {
        addressLines.push(cityStateZip);
      }

      if (
        address.country &&
        address.country !== "US" &&
        address.country !== "USA"
      ) {
        addressLines.push(address.country);
      }

      // Draw each address line
      addressLines.forEach((line) => {
        page.drawText(line, {
          size: 10,
          x: 70,
          y: yPos,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPos -= 15;
      });
    }

    yPos -= 10; // Add some extra spacing before animal info
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

    // Calculate dynamic items start position based on current yPos
    yPos -= 40; // Add spacing before items table
    const itemsY = Math.min(yPos, height - 180); // Ensure minimum space from top

    // Draw items header background
    page.drawRectangle({
      x: 50,
      y: itemsY - 20,
      width: width - 100,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    // Draw table header border
    page.drawRectangle({
      x: 50,
      y: itemsY - 20,
      width: width - 100,
      height: 25,
      borderWidth: 1,
      borderColor: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Procedure", {
      x: 60,
      y: itemsY - 8,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Description", {
      x: 180,
      y: itemsY - 8,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Qty", {
      x: 360,
      y: itemsY - 8,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Unit Price", {
      x: 410,
      y: itemsY - 8,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Total", {
      x: 500,
      y: itemsY - 8,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Draw items
    let currentY = itemsY - 35; // Start below header

    if (invoice.animalSections && invoice.animalSections.length > 0) {
      // Iterate through animal sections
      invoice.animalSections.forEach((section) => {
        // Check if we need a new page for animal header
        if (currentY < 120) {
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
          currentY -= 40;

          // Redraw table header on new page
          page.drawRectangle({
            x: 50,
            y: currentY - 20,
            width: width - 100,
            height: 25,
            color: rgb(0.95, 0.95, 0.95),
          });

          page.drawRectangle({
            x: 50,
            y: currentY - 20,
            width: width - 100,
            height: 25,
            borderWidth: 1,
            borderColor: rgb(0.8, 0.8, 0.8),
          });

          page.drawText("Procedure", {
            x: 60,
            y: currentY - 8,
            size: 10,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          page.drawText("Description", {
            x: 180,
            y: currentY - 8,
            size: 10,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          page.drawText("Qty", {
            x: 360,
            y: currentY - 8,
            size: 10,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          page.drawText("Unit Price", {
            x: 410,
            y: currentY - 8,
            size: 10,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          page.drawText("Total", {
            x: 500,
            y: currentY - 8,
            size: 10,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          });

          currentY -= 35;
        }

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
          // Calculate dynamic item height first
          const procedureLines = wrapText(item.procedure || "", 20);
          const descriptionLines = wrapText(item.description || "", 30);
          const maxLines = Math.max(
            procedureLines.length,
            descriptionLines.length
          );
          const dynamicItemHeight = Math.max(25, maxLines * 14 + 10); // 14px per line + 10px padding

          // Check if we need a new page for this item
          if (currentY - dynamicItemHeight < 100) {
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
            currentY -= 40;

            // Redraw table header on new page
            page.drawRectangle({
              x: 50,
              y: currentY - 20,
              width: width - 100,
              height: 25,
              color: rgb(0.95, 0.95, 0.95),
            });

            page.drawRectangle({
              x: 50,
              y: currentY - 20,
              width: width - 100,
              height: 25,
              borderWidth: 1,
              borderColor: rgb(0.8, 0.8, 0.8),
            });

            page.drawText("Procedure", {
              x: 60,
              y: currentY - 8,
              size: 10,
              font: boldFont,
              color: rgb(0.1, 0.1, 0.1),
            });
            page.drawText("Description", {
              x: 180,
              y: currentY - 8,
              size: 10,
              font: boldFont,
              color: rgb(0.1, 0.1, 0.1),
            });
            page.drawText("Qty", {
              x: 360,
              y: currentY - 8,
              size: 10,
              font: boldFont,
              color: rgb(0.1, 0.1, 0.1),
            });
            page.drawText("Unit Price", {
              x: 410,
              y: currentY - 8,
              size: 10,
              font: boldFont,
              color: rgb(0.1, 0.1, 0.1),
            });
            page.drawText("Total", {
              x: 500,
              y: currentY - 8,
              size: 10,
              font: boldFont,
              color: rgb(0.1, 0.1, 0.1),
            });

            currentY -= 35;
          }

          // Draw item procedure
          procedureLines.forEach((line, i) => {
            page.drawText(line, {
              x: 60,
              y: currentY - i * 14,
              size: 10,
              font,
              color: rgb(0.1, 0.1, 0.1),
            });
          });

          // Description with word wrap
          descriptionLines.forEach((line, i) => {
            page.drawText(line, {
              x: 180,
              y: currentY - i * 14,
              size: 9,
              font,
              color: rgb(0.3, 0.3, 0.3),
            });
          });

          // Quantity (right-aligned)
          const qtyText = item.quantity?.toString() || "1";
          page.drawText(qtyText, {
            x: 375 - qtyText.length * 6, // Right-align in column
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });

          // Unit Price (right-aligned)
          const unitPriceText = `$${Number(item.unitPrice || 0).toFixed(2)}`;
          page.drawText(unitPriceText, {
            x: 480 - unitPriceText.length * 6, // Right-align in column
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });

          // Total (right-aligned)
          const totalText = `$${Number(item.total || 0).toFixed(2)}`;
          page.drawText(totalText, {
            x: 545 - totalText.length * 6, // Right-align in column
            y: currentY,
            size: 10,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });

          // Adjust y position for next item
          currentY -= dynamicItemHeight;
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

    // Draw totals - ensure they're positioned properly
    const totalsY = Math.max(120, currentY - 60); // Ensure totals don't overlap with items

    // Check if we need a new page for totals
    if (totalsY < 150) {
      page = pdfDoc.addPage([595.28, 841.89]);
      const newTotalsY = height - 100;

      // Add header to new page
      page.drawText(`INVOICE #${invoice.invoiceNumber} (continued)`, {
        x: 50,
        y: height - 50,
        size: 16,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      // Draw totals on new page
      page.drawLine({
        start: { x: 360, y: newTotalsY + 20 },
        end: { x: width - 50, y: newTotalsY + 20 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      page.drawText("Subtotal:", {
        x: 410,
        y: newTotalsY,
        size: 10,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const subtotalText = `$${invoice.subtotal?.toFixed(2)}`;
      page.drawText(subtotalText, {
        x: 545 - subtotalText.length * 6,
        y: newTotalsY,
        size: 10,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawLine({
        start: { x: 360, y: newTotalsY - 10 },
        end: { x: width - 50, y: newTotalsY - 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      page.drawText("Total:", {
        x: 410,
        y: newTotalsY - 30,
        size: 12,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const totalText = `$${invoice.total?.toFixed(2)}`;
      page.drawText(totalText, {
        x: 545 - totalText.length * 7,
        y: newTotalsY - 30,
        size: 12,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
    } else {
      // Draw totals on current page
      page.drawLine({
        start: { x: 360, y: totalsY + 20 },
        end: { x: width - 50, y: totalsY + 20 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      page.drawText("Subtotal:", {
        x: 410,
        y: totalsY,
        size: 10,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const subtotalText = `$${invoice.subtotal?.toFixed(2)}`;
      page.drawText(subtotalText, {
        x: 545 - subtotalText.length * 6,
        y: totalsY,
        size: 10,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawLine({
        start: { x: 360, y: totalsY - 10 },
        end: { x: width - 50, y: totalsY - 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      page.drawText("Total:", {
        x: 410,
        y: totalsY - 30,
        size: 12,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      const totalText = `$${invoice.total?.toFixed(2)}`;
      page.drawText(totalText, {
        x: 545 - totalText.length * 7,
        y: totalsY - 30,
        size: 12,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

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
 * Helper function to wrap text intelligently
 */
function wrapText(text: string, maxChars: number): string[] {
  if (!text || text.trim().length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = "";

  // Split by existing line breaks first
  const paragraphs = text.split(/\n|\r\n/);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    if (paragraphIndex > 0 && currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    const words = paragraph.trim().split(/\s+/);

    for (const word of words) {
      // Handle very long words that exceed maxChars
      if (word.length > maxChars) {
        // If we have a current line, push it first
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }

        // Break the long word into chunks
        for (let i = 0; i < word.length; i += maxChars - 1) {
          const chunk = word.slice(i, i + maxChars - 1);
          lines.push(chunk + (i + maxChars - 1 < word.length ? "-" : ""));
        }
      } else if (currentLine.length + word.length + 1 <= maxChars) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
  });

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
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
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

/**
 * Generate a medical history PDF for an animal
 */
export const generateMedicalHistoryPdf = async (animal: {
  name: string;
  species: string;
  breed?: string;
  ageYears?: number;
  ageMonths?: number;
  age?: number;
  gender?: string;
  weight: number | null;
  microchipNumber?: string;
  clientName?: string;
  medicalHistory?: Array<{
    date: Date;
    procedure: string;
    notes: string;
    veterinarian: string;
  }>;
}): Promise<Uint8Array> => {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Add fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawText("Medical History Report", {
      x: 50,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("AHA Spay/Neuter Clinic", {
      x: 50,
      y: height - 75,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
      x: width - 200,
      y: height - 75,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Animal Information Section
    let yPos = height - 120;
    page.drawText("Animal Information", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Draw line under section title
    page.drawLine({
      start: { x: 50, y: yPos - 5 },
      end: { x: width - 50, y: yPos - 5 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPos -= 25;

    // Animal details
    page.drawText(`Name: ${animal.name}`, {
      x: 70,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPos -= 15;
    page.drawText(
      `Species: ${animal.species}${animal.breed ? ` - ${animal.breed}` : ""}`,
      {
        x: 70,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.1, 0.1, 0.1),
      }
    );

    yPos -= 15;
    // Age formatting
    let ageText = "Age: ";
    if (animal.ageYears !== undefined || animal.ageMonths !== undefined) {
      const years = animal.ageYears || 0;
      const months = animal.ageMonths || 0;
      if (years === 0 && months === 0) {
        ageText += "Unknown";
      } else if (years === 0) {
        ageText += `${months} months`;
      } else if (months === 0) {
        ageText += `${years} years`;
      } else {
        ageText += `${years} years, ${months} months`;
      }
    } else if (animal.age) {
      ageText += `${animal.age} years`;
    } else {
      ageText += "Unknown";
    }

    page.drawText(ageText, {
      x: 70,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPos -= 15;
    page.drawText(
      `Gender: ${
        animal.gender
          ? animal.gender.charAt(0).toUpperCase() + animal.gender.slice(1)
          : "Unknown"
      }`,
      {
        x: 70,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.1, 0.1, 0.1),
      }
    );

    yPos -= 15;
    page.drawText(
      `Weight: ${animal.weight != null ? `${animal.weight} lbs` : "Unknown"}`,
      {
        x: 70,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.1, 0.1, 0.1),
      }
    );

    yPos -= 15;
    page.drawText(
      `Microchip: ${animal.microchipNumber || "Not microchipped"}`,
      {
        x: 70,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.1, 0.1, 0.1),
      }
    );

    if (animal.clientName) {
      yPos -= 15;
      page.drawText(`Owner: ${animal.clientName}`, {
        x: 70,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    // Medical History Section
    yPos -= 40;
    page.drawText("Medical History", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Draw line under section title
    page.drawLine({
      start: { x: 50, y: yPos - 5 },
      end: { x: width - 50, y: yPos - 5 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPos -= 25;

    if (animal.medicalHistory && animal.medicalHistory.length > 0) {
      for (const record of animal.medicalHistory) {
        // Check if we need a new page
        if (yPos < 100) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPos = height - 50;
        }

        // Record date and procedure
        page.drawText(
          `${new Date(record.date).toLocaleDateString()} - ${record.procedure}`,
          {
            x: 70,
            y: yPos,
            size: 11,
            font: boldFont,
            color: rgb(0.1, 0.1, 0.1),
          }
        );

        yPos -= 15;

        // Veterinarian
        page.drawText(`Veterinarian: ${record.veterinarian}`, {
          x: 90,
          y: yPos,
          size: 9,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });

        yPos -= 15;

        // Notes - wrap text if needed
        const notes = record.notes || "";
        const maxCharsPerLine = 65;
        const noteLines = wrapText(notes, maxCharsPerLine);

        page.drawText("Notes:", {
          x: 90,
          y: yPos,
          size: 9,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });

        yPos -= 12;

        for (const line of noteLines) {
          if (yPos < 50) {
            page = pdfDoc.addPage([595.28, 841.89]);
            yPos = height - 50;
          }

          page.drawText(line, {
            x: 110,
            y: yPos,
            size: 9,
            font: font,
            color: rgb(0.1, 0.1, 0.1),
          });

          yPos -= 12;
        }

        yPos -= 10; // Space between records

        // Draw a light separator line between records
        if (yPos > 50) {
          page.drawLine({
            start: { x: 70, y: yPos },
            end: { x: width - 50, y: yPos },
            thickness: 0.5,
            color: rgb(0.9, 0.9, 0.9),
          });
          yPos -= 15;
        }
      }
    } else {
      page.drawText("No medical history available", {
        x: 70,
        y: yPos,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Footer
    const footerY = 30;
    page.drawText(
      "This report was generated by AHA Spay/Neuter Clinic Management System",
      {
        x: 50,
        y: footerY,
        size: 8,
        font: font,
        color: rgb(0.6, 0.6, 0.6),
      }
    );

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    throw new Error(
      `Failed to generate medical history PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFForm,
  PDFPage,
  PDFFont,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Create a blank medical form template with fillable form fields
 */
export const createMedicalFormTemplate = async (): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const form = pdfDoc.getForm();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Set up the page
  const { width, height } = page.getSize();

  // Add title
  page.drawText("Medical Form", {
    x: 50,
    y: height - 50,
    size: 24,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText("AHA Clinic", {
    x: 50,
    y: height - 80,
    size: 12,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Add form sections
  addPatientInfoSection(
    page,
    form,
    helveticaBold,
    helvetica,
    50,
    height - 120,
    width - 100
  );
  addMedicalHistorySection(
    page,
    form,
    helveticaBold,
    helvetica,
    50,
    height - 350,
    width - 100
  );
  addMedicationsSection(
    page,
    form,
    helveticaBold,
    helvetica,
    50,
    height - 550,
    width - 100
  );
  addSignatureSection(
    page,
    form,
    helveticaBold,
    helvetica,
    50,
    height - 750,
    width - 100
  );

  return await pdfDoc.save();
};

/**
 * Add patient information section with form fields
 */
const addPatientInfoSection = (
  page: PDFPage,
  form: PDFForm,
  boldFont: PDFFont,
  _regularFont: PDFFont, // Underscore prefix to indicate unused parameter
  x: number,
  y: number,
  width: number
) => {
  // Section title
  page.drawText("Patient Information", {
    x,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Section separator
  page.drawLine({
    start: { x, y: y - 10 },
    end: { x: x + width, y: y - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Create form fields
  const nameField = form.createTextField("patient.name");
  nameField.setText("");
  nameField.addToPage(page, { x: x + 120, y: y - 40, width: 300, height: 20 });

  const speciesField = form.createTextField("patient.species");
  speciesField.setText("");
  speciesField.addToPage(page, {
    x: x + 120,
    y: y - 70,
    width: 300,
    height: 20,
  });

  const breedField = form.createTextField("patient.breed");
  breedField.setText("");
  breedField.addToPage(page, {
    x: x + 120,
    y: y - 100,
    width: 300,
    height: 20,
  });

  const ageField = form.createTextField("patient.age");
  ageField.setText("");
  ageField.addToPage(page, { x: x + 120, y: y - 130, width: 300, height: 20 });

  const sexField = form.createTextField("patient.sex");
  sexField.setText("");
  sexField.addToPage(page, { x: x + 120, y: y - 160, width: 300, height: 20 });

  // Add labels
  page.drawText("Patient Name:", {
    x,
    y: y - 35,
    size: 10,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("Species:", {
    x,
    y: y - 65,
    size: 10,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("Breed:", {
    x,
    y: y - 95,
    size: 10,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("Age:", {
    x,
    y: y - 125,
    size: 10,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("Sex:", {
    x,
    y: y - 155,
    size: 10,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
};

/**
 * Add medical history section with form fields
 */
const addMedicalHistorySection = (
  page: PDFPage,
  form: PDFForm,
  boldFont: PDFFont,
  regularFont: PDFFont,
  x: number,
  y: number,
  width: number
) => {
  // Section title
  page.drawText("Medical History", {
    x,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Section separator
  page.drawLine({
    start: { x, y: y - 10 },
    end: { x: x + width, y: y - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Yes/No checkboxes for common conditions
  const conditions = [
    "Allergies",
    "Heart Disease",
    "Kidney Disease",
    "Liver Disease",
    "Neurological Disorders",
  ];

  conditions.forEach((condition, index) => {
    const yPos = y - 40 - index * 30;

    page.drawText(`${condition}:`, {
      x,
      y: yPos,
      size: 10,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Yes checkbox
    const yesCheckbox = form.createCheckBox(
      `history.${condition.toLowerCase()}.yes`
    );
    yesCheckbox.addToPage(page, {
      x: x + 150,
      y: yPos - 10,
      width: 15,
      height: 15,
    });

    page.drawText("Yes", {
      x: x + 170,
      y: yPos,
      size: 10,
      font: regularFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // No checkbox
    const noCheckbox = form.createCheckBox(
      `history.${condition.toLowerCase()}.no`
    );
    noCheckbox.addToPage(page, {
      x: x + 200,
      y: yPos - 10,
      width: 15,
      height: 15,
    });

    page.drawText("No", {
      x: x + 220,
      y: yPos,
      size: 10,
      font: regularFont,
      color: rgb(0.1, 0.1, 0.1),
    });
  });
};

/**
 * Add medications section with form fields
 */
const addMedicationsSection = (
  page: PDFPage,
  form: PDFForm,
  boldFont: PDFFont,
  regularFont: PDFFont,
  x: number,
  y: number,
  width: number
) => {
  // Section title
  page.drawText("Current Medications", {
    x,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Section separator
  page.drawLine({
    start: { x, y: y - 10 },
    end: { x: x + width, y: y - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Medications list
  const medicationsField = form.createTextField("medications");
  medicationsField.setText("");
  medicationsField.addToPage(page, { x, y: y - 40, width, height: 100 });

  page.drawText("List all current medications and supplements:", {
    x,
    y: y - 30,
    size: 10,
    font: regularFont,
    color: rgb(0.1, 0.1, 0.1),
  });
};

/**
 * Add signature section with form fields
 */
const addSignatureSection = (
  page: PDFPage,
  form: PDFForm,
  boldFont: PDFFont,
  regularFont: PDFFont,
  x: number,
  y: number,
  width: number
) => {
  // Section title
  page.drawText("Authorization", {
    x,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Section separator
  page.drawLine({
    start: { x, y: y - 10 },
    end: { x: x + width, y: y - 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Authorization text
  page.drawText(
    "I certify that the information provided above is accurate to the best of my knowledge.",
    {
      x,
      y: y - 30,
      size: 10,
      font: regularFont,
      color: rgb(0.1, 0.1, 0.1),
    }
  );

  // Signature field
  const signatureField = form.createTextField("signature");
  signatureField.setText("");
  signatureField.addToPage(page, { x, y: y - 60, width: 300, height: 30 });

  page.drawText("Signature:", {
    x,
    y: y - 50,
    size: 10,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Date field
  const dateField = form.createTextField("date");
  dateField.setText("");
  dateField.addToPage(page, { x: x + 350, y: y - 60, width: 150, height: 30 });

  page.drawText("Date:", {
    x: x + 350,
    y: y - 50,
    size: 10,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
};

// Import the types directly from the library instead of defining interfaces

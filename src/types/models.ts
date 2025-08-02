export interface Client {
  id: string;
  _id?: string; // MongoDB ID
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    county?: string; // County field for PDF forms
  };
  isBlacklisted?: boolean;
  blacklistReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  role: "admin" | "staff" | "user";
  lastLogin?: Date;
  createdAt: Date;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface UserProfile {
  user: User;
  permissions: string[];
}

export interface Animal {
  id: string;
  _id?: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed?: string;
  age?: number; // Keep for backward compatibility
  ageYears?: number;
  ageMonths?: number;
  gender?: "male" | "female" | "unknown";
  weight: number | null;
  client?: string; // Optional reference to a client
  clientName?: string; // For UI display
  organization?: string; // Optional reference to an organization
  organizationName?: string; // For UI display
  medicalHistory: MedicalRecord[];
  notes?: string;
  isActive?: boolean;
  microchipNumber?: string;
  dateOfBirth?: Date;
  isSpayedNeutered?: boolean;
  spayNeuterDate?: Date;
  color?: string; // Animal Color
  vaccineDate?: Date; // Vaccination Date
  nextVaccineDate?: Date; // Vaccination Date Next
  tagNumber?: string; // Tag Number
  vaccineSerial?: string; // Vaccine Serial
  lotExpiration?: Date; // Vaccine Lot Expiration
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  _id?: string; // MongoDB ID for subdocuments
  animalId: string;
  date: Date;
  procedure: string;
  notes: string;
  veterinarian: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RescueOrganization {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceAnimalSection {
  animalId: string;
  items: InvoiceItem[];
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: Date;
  dueDate: Date;
  animalSections: InvoiceAnimalSection[];
  subtotal: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "credit_card" | "bank_transfer" | "check" | null;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  procedure: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DocumentVersion {
  _id?: string;
  fileData?: Uint8Array; // Not typically used in the frontend
  createdAt: Date;
  createdBy?: string;
  notes?: string;
}

export interface Document {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  fileType: "PDF" | "IMAGE" | "OTHER";
  animal?: {
    _id: string;
    name: string;
    species?: string;
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
  isEditable: boolean;
  isPrintable: boolean;
  versions?: DocumentVersion[];
  currentVersion: number;
  isShared: boolean;
  shareLink?: string;
  shareLinkExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/* To be implemented later:
export interface Appointment {
  id: string;
  clientId: string;
  animalId: string;
  date: Date;
  time: string;
  type: "SPAY" | "NEUTER" | "CHECKUP" | "FOLLOWUP";
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
*/

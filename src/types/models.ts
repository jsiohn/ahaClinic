export interface Client {
  id: string;
  _id?: string; // MongoDB ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isBlacklisted?: boolean;
  blacklistReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Animal {
  id: string;
  _id?: string;
  name: string;
  species: "DOG" | "CAT" | "OTHER";
  breed?: string;
  age?: number;
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
  dateOfBirth: Date;
  isSpayedNeutered?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  animalId: string;
  date: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "credit_card" | "bank_transfer" | "check" | null;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  procedure: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
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

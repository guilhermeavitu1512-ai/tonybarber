export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkingHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface WeeklySchedule {
  [key: number]: WorkingHours;
}

export interface Barbershop {
  name: string;
  address: string;
  phone: string;
  schedule: WeeklySchedule;
}

export interface Barber {
  id: string;
  name: string;
  photoUrl?: string;
  specialties: string[];
  schedule: WeeklySchedule;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  barberIds: string[];
  barberOverrides?: {
    [barberId: string]: {
      price?: number;
      durationMinutes?: number;
    }
  };
  isActive: boolean;
}

export type AppointmentStatus = 'pending_confirmation' | 'confirmed' | 'cancellation_requested' | 'on_the_way' | 'completed' | 'cancelled' | 'no_show';
export type WhatsAppConfirmationStatus = 'not_sent' | 'opened' | 'sent_manually';

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  whatsapp_confirmation_status?: WhatsAppConfirmationStatus;
  serviceId: string;
  barberId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  paymentStatus?: 'pending' | 'paid';
  createdAt: string;
  productIds?: string[];
  totalPrice?: number;
  clientProfileId?: string; // Link to Meu Estilo
}

export interface Block {
  id: string;
  barberId: string;
  startTime: string;
  endTime: string;
  reason: string;
}

// ---- MEU ESTILO & UPSELL TYPES ----

export interface ClientProfile {
  id: string;
  authUserId: string;
  fullName: string;
  phone: string;
  email: string;
  preferredBarberId?: string;
  preferredServiceId?: string;
  usualFrequencyDays?: number;
  customerNotes?: string;
  marketingConsent: boolean;
  reminderConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientStyleImage {
  id: string;
  clientProfileId: string;
  storagePath: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductRecommendation {
  id: string;
  serviceId: string;
  productId: string;
  priority: number;
  label?: string;
  reason?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stockPhysical: number;
  stockReserved: number;
  stockAvailable: number;
  stockMinimum: number;
  isActive: boolean;
  imageUrl?: string;
  category?: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  appointmentId?: string;
  movementType: 'entry' | 'sale' | 'reservation' | 'release' | 'loss' | 'adjustment';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  validityDays: number;
  isActive: boolean;
  isFeatured: boolean;
  servicesIncluded: {
    serviceId: string;
    quantity: number;
  }[];
  createdAt: string;
}

export interface ClientPackage {
  id: string;
  clientProfileId: string;
  packageId: string;
  purchasePrice: number;
  paymentStatus: 'pending' | 'paid';
  status: 'active' | 'exhausted' | 'expired' | 'cancelled';
  startsAt: string;
  expiresAt: string;
  servicesBalance: {
    serviceId: string;
    total: number;
    used: number;
    reserved: number;
  }[];
  createdAt: string;
}

export interface ClientPackageMovement {
  id: string;
  clientPackageId: string;
  appointmentId?: string;
  serviceId: string;
  movementType: 'purchase' | 'reservation' | 'release' | 'consumption' | 'manual_credit' | 'manual_debit' | 'expiration' | 'cancellation';
  quantity: number;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  barberId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  timePreferences: string;
  status: 'waiting' | 'notified' | 'resolved';
  createdAt: string;
}

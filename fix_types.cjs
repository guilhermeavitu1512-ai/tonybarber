const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const targetStatus = `export type AppointmentStatus = 'pending_confirmation' | 'confirmed' | 'cancellation_requested' | 'on_the_way' | 'completed' | 'cancelled' | 'no_show';`;

const newStatus = `export type AppointmentStatus = 'pending_confirmation' | 'confirmed' | 'cancellation_requested' | 'on_the_way' | 'completed' | 'cancelled' | 'no_show';
export type WhatsAppConfirmationStatus = 'not_sent' | 'opened' | 'sent_manually';`;

code = code.replace(targetStatus, newStatus);

const targetAppt = `export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerPhone_e164?: string;
  customerEmail: string;
  consent_whatsapp_transactional?: boolean;`;

const newAppt = `export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  whatsapp_confirmation_status?: WhatsAppConfirmationStatus;`;

code = code.replace(targetAppt, newAppt);
fs.writeFileSync('src/types.ts', code);

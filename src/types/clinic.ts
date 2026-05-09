// Shared TypeScript types & enums mirroring the backend Prisma schema

export type UserRole = 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

export type SubscriptionStatus = 'active' | 'suspended' | 'expired' | 'pending';
export type SubscriptionPlan = 'monthly' | 'yearly' | 'custom';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  doctorId?: string; // Linked to the DOCTOR for RECEPTIONISTS
  isActive: boolean;
  createdAt: string;
  // Subscription-related fields (for doctors)
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionEndDate?: string;
  phone?: string;
  clinicName?: string;
  specialty?: string;
  displayId?: string; // Short ID for admin search (e.g., 9 digits)
}

export interface Subscription {
  id: string;
  doctorId: string;
  doctorName?: string;    // denormalized for display
  doctorEmail?: string;   // denormalized for display
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  price: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;      // admin UID
  notes?: string;
}

export interface PlatformPricing {
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  updatedAt: string;
  updatedBy: string;
}

export type Gender = 'MALE' | 'FEMALE';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Patient {
  id: string;
  patientId: string; // CLN-000001
  doctorId: string;  // Multi-tenant link
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  address: string;
  bloodType: BloodType;
  createdAt: string;
  // computed on read
  age?: number;
  medicalHistory?: MedicalHistory[];
  drugAllergies?: DrugAllergy[];
}

export interface MedicalHistory {
  id: string;
  patientId: string;
  condition: string;
  type: 'CHRONIC_DISEASE' | 'SURGERY';
  dateRecorded: string;
  notes: string;
}

export interface DrugAllergy {
  id: string;
  patientId: string;
  drugName: string;
  severity: string;
  reaction: string;
}

export type VisitType = 'NEW_EXAM' | 'CONSULTATION_FREE' | 'CONSULTATION_PAID' | 'URGENT' | 'SONAR' | 'ECG';
export type AppointmentStatus = 'WAITING' | 'IN_CLINIC' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;  // Multi-tenant link
  patient?: Patient;
  patientName?: string; // Denormalized for display
  patientPhone?: string; // For public tracking
  createdById: string;
  visitType: VisitType;
  status: AppointmentStatus;
  queueNumber: number;
  fee: number;
  isPaid: boolean;
  scheduledAt: string;
  createdAt: string;
}

export interface VitalSigns {
  // Numeric fields stored separately
  weight?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  sugar?: number;
  pulse?: number;
  // String / combined fields used in workspace forms
  bp?: string;          // e.g. "120/80"
  heartRate?: number;
  temperature?: number;
  o2Sat?: number;
}

export interface Visit {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  chiefComplaint: string;
  diagnosis: string;
  notes: string;
  vitalSigns: VitalSigns;
  startedAt: string;
  completedAt?: string;
  prescription?: Prescription;
}

export type DrugForm = 'TABLET' | 'SYRUP' | 'INJECTION' | 'CREAM' | 'DROPS' | 'CAPSULE' | 'INHALER' | 'SUPPOSITORY';

export interface Drug {
  id: string;
  name: string;
  genericName: string;
  concentration: string;
  form: DrugForm;
  isActive: boolean;
}

export interface PrescriptionItem {
  id?: string;
  drugId: string;
  drugName: string;
  concentration: string;
  form: DrugForm;
  dose: string;
  frequency: string;
  duration: string;
  timing?: string;
  customNotes?: string;
}

export interface Prescription {
  id: string;
  visitId: string;
  doctorId: string;
  patientId: string;
  notes?: string;
  createdAt: string;
  items: PrescriptionItem[];
}

export interface AllergyWarning {
  drug: string;
  allergy: DrugAllergy;
  severity: string;
}

export type ExpenseCategory = 'SUPPLIES' | 'MAINTENANCE' | 'UTILITIES' | 'OTHER';
export type PaymentMethod = 'CASH' | 'FREE';

export interface Payment {
  id: string;
  appointmentId: string;
  doctorId: string; // Multi-tenant link
  collectedById: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  loggedById: string;
  doctorId: string; // Multi-tenant link
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  createdAt: string;
}

export interface ShiftCloseReport {
  date: string;
  totalRevenue: number;
  totalExpenses: number;
  netCash: number;
  payments: (Payment & { appointment?: { patient?: Patient; visitType: VisitType } })[];
  expenses: Expense[];
}

export interface ClinicSettings {
  id: string;
  clinicName: string;
  doctorName: string;
  doctorTitle: string;
  specialty: string;
  address: string;
  phone: string;
  workingHours: string;
  logoUrl?: string;
  logoBase64?: string;       // base64 stored directly in Firestore (≤ 100KB)
  defaultPrintSize: 'A4' | 'A5';
  pricing?: Partial<Record<VisitType, number>>;  // per-visit-type fee overrides
  updatedAt: string;
}

export interface AnalyticsPatients {
  total: number;
  new: number;
  consultations: number;
  byType: Record<VisitType, number>;
}

export interface AnalyticsRevenuePoint {
  date: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface AnalyticsRevenue {
  data: AnalyticsRevenuePoint[];
  totals: { revenue: number; expenses: number; net: number };
}

export interface QueueStats {
  waiting: number;
  inClinic: number;
  completed: number;
  cancelled: number;
}

export interface QueueUpdate {
  appointments: Appointment[];
  stats: QueueStats;
}

export type ServiceType = 'NEW_EXAM' | 'CONSULTATION' | 'URGENT' | 'SONAR' | 'ECG';

export interface ServicePrice {
  id: string;
  serviceType: ServiceType;
  price: number;
  isActive: boolean;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

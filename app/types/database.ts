// Database Types for MedNotes AI
// These types match the Supabase database schema

export type UserRole = 'patient' | 'doctor';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'in_progress';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type DocumentType = 'prescription' | 'report' | 'scan' | 'lab_result' | 'other';

// Profile extends auth.users
export interface Profile {
  id: string; // UUID, references auth.users.id
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  phone: string | null;
  date_of_birth: string | null; // ISO date string
  specialization: string | null; // For doctors
  doctor_id: string | null; // Unique doctor identifier (e.g., "DR001")
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Appointments
export interface Appointment {
  id: string; // UUID
  patient_id: string; // References profiles.id
  doctor_id: string; // References profiles.id
  appointment_date: string; // ISO timestamp
  status: AppointmentStatus;
  notes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Appointments with joined profile data
export interface AppointmentWithProfiles extends Appointment {
  patient: Profile;
  doctor: Profile;
}

// Consultations
export interface Consultation {
  id: string; // UUID
  appointment_id: string; // References appointments.id (unique)
  audio_url: string | null; // Supabase Storage URL
  transcript: string | null;
  ai_summary: string | null;
  doctor_notes: string | null;
  duration_minutes: number | null;
  consultation_date: string; // ISO timestamp
  kestra_execution_id: string | null; // Kestra workflow execution ID
  processing_status: ProcessingStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Consultations with joined appointment data
export interface ConsultationWithAppointment extends Consultation {
  appointment: AppointmentWithProfiles;
}

// Documents
export interface Document {
  id: string; // UUID
  patient_id: string; // References profiles.id
  consultation_id: string | null; // References consultations.id (nullable)
  document_type: DocumentType;
  file_url: string; // Supabase Storage URL
  ocr_text: string | null;
  ai_extracted_data: Record<string, any> | null; // JSONB - structured AI extracted data
  upload_date: string; // ISO timestamp
  created_at: string; // ISO timestamp
  kestra_execution_id: string | null;
  processing_status: ProcessingStatus;
}

// Documents with joined data
export interface DocumentWithRelations extends Document {
  patient: Profile;
  consultation: Consultation | null;
}

// Chat Messages
export interface ChatMessage {
  id: string; // UUID
  consultation_id: string; // References consultations.id
  user_id: string; // References profiles.id
  user_type: UserRole;
  message: string;
  ai_response: string;
  created_at: string; // ISO timestamp
}

// Chat Messages with joined data
export interface ChatMessageWithUser extends ChatMessage {
  user: Profile;
  consultation: Consultation;
}

// Booking Chat Messages
export interface BookingChat {
  id: string; // UUID
  appointment_id: string | null; // References appointments.id (nullable initially)
  patient_id: string; // References profiles.id
  message: string; // Patient message
  ai_response: string; // AI assistant response
  created_at: string; // ISO timestamp
}

// Booking Chat with joined data
export interface BookingChatWithRelations extends BookingChat {
  appointment: Appointment | null;
  patient: Profile;
}

// AI Extracted Data Structure (example for documents)
export interface ExtractedDocumentData {
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  lab_results?: Array<{
    test_name: string;
    value: string;
    unit: string;
    reference_range: string;
  }>;
  diagnosis?: string[];
  recommendations?: string[];
  follow_up_date?: string;
  [key: string]: any; // Allow additional fields
}


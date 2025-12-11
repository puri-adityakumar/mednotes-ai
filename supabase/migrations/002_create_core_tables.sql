-- Healthcare Consultation Web App - Database Schema
-- Adapted for Supabase Auth (uses auth.users instead of custom password_hash)

-- Extend profiles table with additional fields for patients and doctors
-- Note: profiles table already exists from 001_create_profiles_table.sql
-- We'll add additional fields that might be needed

-- Add optional fields to profiles if not already present
DO $$ 
BEGIN
    -- Add phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone varchar(20);
    END IF;
    
    -- Add date_of_birth if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth date;
    END IF;
    
    -- Add specialization for doctors if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'specialization') THEN
        ALTER TABLE public.profiles ADD COLUMN specialization varchar(100);
    END IF;
    
    -- Add doctor_id for doctors if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'doctor_id') THEN
        ALTER TABLE public.profiles ADD COLUMN doctor_id varchar(50);
    END IF;
END $$;

-- Create unique index on doctor_id for doctors
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_doctor_id 
ON public.profiles(doctor_id) 
WHERE doctor_id IS NOT NULL;

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_date timestamptz NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'in_progress')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Create consultations table
CREATE TABLE IF NOT EXISTS public.consultations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    audio_url text, -- URL to recorded consultation audio file in Supabase Storage
    transcript text, -- Full transcript of the consultation
    ai_summary text, -- AI-generated summary of consultation
    doctor_notes text, -- Doctor written notes
    duration_minutes integer,
    consultation_date timestamptz NOT NULL,
    kestra_execution_id varchar(255), -- Track Kestra workflow execution
    processing_status varchar(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for consultations
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON public.consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultations_consultation_date ON public.consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_processing_status ON public.consultations(processing_status);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL, -- Nullable - document may not be linked to consultation
    document_type varchar(50) NOT NULL CHECK (document_type IN ('prescription', 'report', 'scan', 'lab_result', 'other')),
    file_url text NOT NULL, -- URL to document file in Supabase Storage
    ocr_text text, -- Extracted text from OCR
    ai_extracted_data jsonb, -- Structured data extracted by AI (medications, dosages, dates, etc.)
    upload_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    kestra_execution_id varchar(255), -- Track Kestra OCR workflow execution
    processing_status varchar(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON public.documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_consultation_id ON public.documents(consultation_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON public.documents(upload_date);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON public.documents(processing_status);

-- Create chat_messages table for AI chat assistant
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_type varchar(10) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
    message text NOT NULL, -- User message to AI
    ai_response text NOT NULL, -- AI response
    created_at timestamptz DEFAULT now()
);

-- Create indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_consultation_id ON public.chat_messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
    ON public.appointments FOR SELECT
    USING (
        auth.uid() = patient_id OR 
        auth.uid() = doctor_id
    );

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- Doctors can update appointments they're assigned to
CREATE POLICY "Doctors can update assigned appointments"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = doctor_id)
    WITH CHECK (auth.uid() = doctor_id);

-- RLS Policies for consultations
-- Patients and doctors can view consultations for their appointments
CREATE POLICY "Users can view own consultations"
    ON public.consultations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments
            WHERE appointments.id = consultations.appointment_id
            AND (appointments.patient_id = auth.uid() OR appointments.doctor_id = auth.uid())
        )
    );

-- Doctors can create consultations
CREATE POLICY "Doctors can create consultations"
    ON public.consultations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.appointments
            WHERE appointments.id = consultations.appointment_id
            AND appointments.doctor_id = auth.uid()
        )
    );

-- Doctors can update consultations they created
CREATE POLICY "Doctors can update own consultations"
    ON public.consultations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments
            WHERE appointments.id = consultations.appointment_id
            AND appointments.doctor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.appointments
            WHERE appointments.id = consultations.appointment_id
            AND appointments.doctor_id = auth.uid()
        )
    );

-- RLS Policies for documents
-- Patients can view their own documents
CREATE POLICY "Patients can view own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = patient_id);

-- Patients can create documents
CREATE POLICY "Patients can create documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own documents
CREATE POLICY "Patients can update own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- Doctors can view documents linked to their consultations
CREATE POLICY "Doctors can view consultation documents"
    ON public.documents FOR SELECT
    USING (
        consultation_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.consultations
            JOIN public.appointments ON appointments.id = consultations.appointment_id
            WHERE consultations.id = documents.consultation_id
            AND appointments.doctor_id = auth.uid()
        )
    );

-- RLS Policies for chat_messages
-- Users can view messages for consultations they're part of
CREATE POLICY "Users can view own chat messages"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.consultations
            JOIN public.appointments ON appointments.id = consultations.appointment_id
            WHERE consultations.id = chat_messages.consultation_id
            AND (appointments.patient_id = auth.uid() OR appointments.doctor_id = auth.uid())
        )
    );

-- Users can create messages for consultations they're part of
CREATE POLICY "Users can create chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.consultations
            JOIN public.appointments ON appointments.id = consultations.appointment_id
            WHERE consultations.id = chat_messages.consultation_id
            AND (appointments.patient_id = auth.uid() OR appointments.doctor_id = auth.uid())
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


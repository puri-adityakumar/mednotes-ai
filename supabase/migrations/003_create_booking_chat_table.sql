-- Create booking_chat table for appointment booking conversations
-- This table stores the chat conversation between patient and AI assistant during appointment booking
-- appointment_id is nullable initially (set after appointment is created)

CREATE TABLE IF NOT EXISTS public.booking_chat (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE, -- Nullable initially
    patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL, -- Patient message
    ai_response text NOT NULL, -- AI assistant response
    created_at timestamptz DEFAULT now()
);

-- Create indexes for booking_chat
CREATE INDEX IF NOT EXISTS idx_booking_chat_appointment_id ON public.booking_chat(appointment_id);
CREATE INDEX IF NOT EXISTS idx_booking_chat_patient_id ON public.booking_chat(patient_id);
CREATE INDEX IF NOT EXISTS idx_booking_chat_created_at ON public.booking_chat(created_at);

-- Enable Row Level Security (RLS) on booking_chat table
ALTER TABLE public.booking_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_chat
-- Patients can view their own booking chat messages
CREATE POLICY "Patients can view own booking chat"
    ON public.booking_chat FOR SELECT
    USING (auth.uid() = patient_id);

-- Patients can create booking chat messages
CREATE POLICY "Patients can create booking chat"
    ON public.booking_chat FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own booking chat messages (if needed)
CREATE POLICY "Patients can update own booking chat"
    ON public.booking_chat FOR UPDATE
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- Function to update appointment_id in booking_chat after appointment is created
-- This can be called when an appointment is confirmed from the booking chat
CREATE OR REPLACE FUNCTION public.link_booking_chat_to_appointment(
    p_appointment_id uuid,
    p_patient_id uuid
)
RETURNS void AS $$
BEGIN
    UPDATE public.booking_chat
    SET appointment_id = p_appointment_id
    WHERE patient_id = p_patient_id
    AND appointment_id IS NULL
    AND created_at >= now() - interval '1 hour'; -- Only link recent booking chats (within last hour)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


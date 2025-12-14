-- Add `role` column to booking_chat so we can store one row per message
-- (user + assistant) and group messages by `chat_id` (session).
-- Safe to run multiple times.

ALTER TABLE public.booking_chat
ADD COLUMN IF NOT EXISTS role text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'booking_chat_role_check'
      AND conrelid = 'public.booking_chat'::regclass
  ) THEN
    ALTER TABLE public.booking_chat
    ADD CONSTRAINT booking_chat_role_check
    CHECK (role IS NULL OR role = ANY (ARRAY['user'::text, 'assistant'::text]));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_booking_chat_chat_id ON public.booking_chat(chat_id);
CREATE INDEX IF NOT EXISTS idx_booking_chat_patient_id ON public.booking_chat(patient_id);
CREATE INDEX IF NOT EXISTS idx_booking_chat_appointment_id ON public.booking_chat(appointment_id);



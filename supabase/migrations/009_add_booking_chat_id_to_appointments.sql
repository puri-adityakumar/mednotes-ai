-- Store the booking chat session id on the appointment itself.
-- This allows fetching the full booking conversation even if individual
-- booking_chat rows don't have appointment_id populated (or linking fails).

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS booking_chat_id uuid;

CREATE INDEX IF NOT EXISTS idx_appointments_booking_chat_id
  ON public.appointments(booking_chat_id);



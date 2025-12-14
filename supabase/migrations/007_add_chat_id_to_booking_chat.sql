-- Add chat_id column to booking_chat table to isolate chat sessions
-- This allows multiple concurrent chat sessions per patient without mixing them up

ALTER TABLE public.booking_chat 
ADD COLUMN IF NOT EXISTS chat_id uuid DEFAULT gen_random_uuid();

-- Create index for chat_id for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_chat_chat_id ON public.booking_chat(chat_id);

-- Update existing rows to have unique chat_ids (one per row initially)
-- This ensures existing data has chat_ids, but each message gets its own chat_id
-- New chats will share the same chat_id across messages
UPDATE public.booking_chat 
SET chat_id = gen_random_uuid() 
WHERE chat_id IS NULL;

-- Make chat_id NOT NULL after populating existing rows
ALTER TABLE public.booking_chat 
ALTER COLUMN chat_id SET NOT NULL;


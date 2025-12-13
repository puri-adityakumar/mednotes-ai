-- Create doctor availability/schedule table
-- This table stores doctor working hours and availability

CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    start_time time NOT NULL, -- e.g., '09:00:00'
    end_time time NOT NULL, -- e.g., '17:00:00'
    is_available boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(doctor_id, day_of_week)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day_of_week ON public.doctor_availability(day_of_week);

-- Enable RLS
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view doctor availability (needed for booking)
CREATE POLICY "Anyone can view doctor availability"
    ON public.doctor_availability FOR SELECT
    USING (true);

-- Only doctors can manage their own availability
CREATE POLICY "Doctors can manage own availability"
    ON public.doctor_availability FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = doctor_availability.doctor_id
            AND profiles.id = auth.uid()
            AND profiles.role = 'doctor'
        )
    );

-- Function to check if doctor is available at a given time
CREATE OR REPLACE FUNCTION public.check_doctor_availability(
    p_doctor_id uuid,
    p_appointment_date timestamptz,
    p_appointment_duration_minutes integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_day_of_week integer;
    v_appointment_time time;
    v_end_time timestamptz;
    v_availability_record record;
    v_conflicting_appointment record;
    v_result jsonb;
BEGIN
    -- Extract day of week (0 = Sunday, 1 = Monday, etc.)
    v_day_of_week := EXTRACT(DOW FROM p_appointment_date);
    v_appointment_time := p_appointment_date::time;
    v_end_time := p_appointment_date + (p_appointment_duration_minutes || ' minutes')::interval;

    -- Check if doctor has availability set for this day
    SELECT * INTO v_availability_record
    FROM public.doctor_availability
    WHERE doctor_id = p_doctor_id
    AND day_of_week = v_day_of_week
    AND is_available = true;

    -- If no availability record exists, use default (9 AM - 5 PM, Monday-Friday)
    IF v_availability_record IS NULL THEN
        -- Default: Monday-Friday, 9 AM - 5 PM
        IF v_day_of_week BETWEEN 1 AND 5 THEN
            IF v_appointment_time < '09:00:00' OR v_appointment_time >= '17:00:00' THEN
                v_result := jsonb_build_object(
                    'available', false,
                    'reason', 'Doctor is only available between 9:00 AM and 5:00 PM on weekdays'
                );
                RETURN v_result;
            END IF;
        ELSE
            v_result := jsonb_build_object(
                'available', false,
                'reason', 'Doctor is only available on weekdays (Monday-Friday)'
            );
            RETURN v_result;
        END IF;
    ELSE
        -- Check against custom availability
        IF v_appointment_time < v_availability_record.start_time OR 
           v_appointment_time >= v_availability_record.end_time THEN
            v_result := jsonb_build_object(
                'available', false,
                'reason', format('Doctor is only available between %s and %s on this day',
                    v_availability_record.start_time::text,
                    v_availability_record.end_time::text)
            );
            RETURN v_result;
        END IF;
    END IF;

    -- Check for conflicting appointments (overlapping time slots)
    -- Consider appointments that are scheduled or in_progress (not cancelled or completed)
    SELECT * INTO v_conflicting_appointment
    FROM public.appointments
    WHERE doctor_id = p_doctor_id
    AND status IN ('scheduled', 'in_progress')
    AND appointment_date < v_end_time
    AND appointment_date + interval '30 minutes' > p_appointment_date
    LIMIT 1;

    IF v_conflicting_appointment IS NOT NULL THEN
        v_result := jsonb_build_object(
            'available', false,
            'reason', format('Doctor already has an appointment at %s',
                to_char(v_conflicting_appointment.appointment_date, 'YYYY-MM-DD HH24:MI'))
        );
        RETURN v_result;
    END IF;

    -- All checks passed
    v_result := jsonb_build_object(
        'available', true,
        'reason', 'Doctor is available at this time'
    );
    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_doctor_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_doctor_availability TO anon;

-- Insert default availability for existing doctors (Monday-Friday, 9 AM - 5 PM)
-- This is optional - you can run this to set defaults
-- INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time)
-- SELECT 
--     id,
--     day,
--     '09:00:00'::time,
--     '17:00:00'::time
-- FROM public.profiles
-- CROSS JOIN generate_series(1, 5) AS day
-- WHERE role = 'doctor'
-- ON CONFLICT (doctor_id, day_of_week) DO NOTHING;


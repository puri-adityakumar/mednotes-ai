'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UploadRecordingResult {
    success: boolean;
    message: string;
    consultationId?: string;
    audioUrl?: string;
}

export interface Recording {
    id: string;
    audio_url: string;
    duration_minutes: number | null;
    consultation_date: string;
    processing_status: string;
    transcript: string | null;
    ai_summary: string | null;
    appointment: {
        id: string;
        appointment_date: string;
        status: string;
        patient: {
            first_name: string | null;
            last_name: string | null;
            email: string | null;
        } | null;
    } | null;
}

export interface FetchRecordingsResult {
    success: boolean;
    recordings: Recording[];
    error?: string;
}

export interface AppointmentOption {
    id: string;
    appointment_date: string;
    status: string;
    patient_name: string;
}

export interface FetchAppointmentsResult {
    success: boolean;
    appointments: AppointmentOption[];
    error?: string;
}

/**
 * Fetch appointments available for recording (in_progress or scheduled)
 */
export async function fetchRecordableAppointments(): Promise<FetchAppointmentsResult> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, appointments: [], error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                appointment_date,
                status,
                profiles:patient_id (
                    first_name,
                    last_name
                )
            `)
            .eq('doctor_id', user.id)
            .in('status', ['in_progress', 'scheduled'])
            .order('appointment_date', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
            return { success: false, appointments: [], error: error.message };
        }

        const appointments: AppointmentOption[] = (data || []).map((apt: any) => {
            const patient = Array.isArray(apt.profiles) ? apt.profiles[0] : apt.profiles;
            const patientName = patient
                ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
                : 'Unknown Patient';

            return {
                id: apt.id,
                appointment_date: apt.appointment_date,
                status: apt.status,
                patient_name: patientName,
            };
        });

        return { success: true, appointments };
    } catch (err: any) {
        console.error('fetchRecordableAppointments error:', err);
        return { success: false, appointments: [], error: err.message };
    }
}

/**
 * Fetch all recordings for the current doctor
 */
export async function fetchDoctorRecordings(): Promise<FetchRecordingsResult> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, recordings: [], error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('consultations')
            .select(`
                id,
                audio_url,
                duration_minutes,
                consultation_date,
                processing_status,
                transcript,
                ai_summary,
                appointment:appointments!appointment_id (
                    id,
                    appointment_date,
                    status,
                    patient:profiles!patient_id (
                        first_name,
                        last_name,
                        email
                    )
                )
            `)
            .not('audio_url', 'is', null)
            .order('consultation_date', { ascending: false });

        if (error) {
            console.error('Error fetching recordings:', error);
            return { success: false, recordings: [], error: error.message };
        }

        // Transform and filter by doctor (through appointments)
        const recordings: Recording[] = (data || [])
            .map((item: any) => ({
                ...item,
                appointment: Array.isArray(item.appointment) ? item.appointment[0] : item.appointment,
            }))
            .filter((item: any) => item.appointment !== null);

        return { success: true, recordings };
    } catch (err: any) {
        console.error('fetchDoctorRecordings error:', err);
        return { success: false, recordings: [], error: err.message };
    }
}

/**
 * Create a consultation record after upload (called from client after storage upload)
 */
export async function createConsultationRecord(
    appointmentId: string,
    audioUrl: string,
    durationMinutes: number
): Promise<UploadRecordingResult> {
    try {
        const supabase = await createClient();

        // Verify the appointment exists and belongs to current doctor
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, message: 'Not authenticated' };
        }

        const { data: appointment, error: aptError } = await supabase
            .from('appointments')
            .select('id, doctor_id')
            .eq('id', appointmentId)
            .single();

        if (aptError || !appointment) {
            return { success: false, message: 'Appointment not found' };
        }

        if (appointment.doctor_id !== user.id) {
            return { success: false, message: 'Unauthorized: This appointment belongs to another doctor' };
        }

        // Check if consultation already exists
        const { data: existingConsultation } = await supabase
            .from('consultations')
            .select('id')
            .eq('appointment_id', appointmentId)
            .single();

        let consultationId: string;

        if (existingConsultation) {
            // Update existing consultation
            const { error: updateError } = await supabase
                .from('consultations')
                .update({
                    audio_url: audioUrl,
                    duration_minutes: durationMinutes,
                    processing_status: 'pending',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingConsultation.id);

            if (updateError) {
                console.error('Update error:', updateError);
                return { success: false, message: `Failed to update consultation: ${updateError.message}` };
            }

            consultationId = existingConsultation.id;
        } else {
            // Create new consultation
            const { data: newConsultation, error: insertError } = await supabase
                .from('consultations')
                .insert({
                    appointment_id: appointmentId,
                    audio_url: audioUrl,
                    duration_minutes: durationMinutes,
                    processing_status: 'pending',
                    consultation_date: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (insertError) {
                console.error('Insert error:', insertError);
                return { success: false, message: `Failed to create consultation: ${insertError.message}` };
            }

            consultationId = newConsultation.id;
        }

        // Update appointment status to in_progress if it was scheduled
        await supabase
            .from('appointments')
            .update({ status: 'in_progress', updated_at: new Date().toISOString() })
            .eq('id', appointmentId)
            .eq('status', 'scheduled');

        // Revalidate the recording page
        revalidatePath('/doctor/recording');

        return {
            success: true,
            message: 'Recording uploaded successfully',
            consultationId,
            audioUrl,
        };
    } catch (err: any) {
        console.error('createConsultationRecord error:', err);
        return { success: false, message: err.message || 'An unexpected error occurred' };
    }
}

/**
 * Delete a recording
 */
export async function deleteRecording(consultationId: string): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, message: 'Not authenticated' };
        }

        // Get the consultation to find the audio URL
        const { data: consultation, error: fetchError } = await supabase
            .from('consultations')
            .select(`
                id,
                audio_url,
                appointment:appointments!appointment_id (
                    doctor_id
                )
            `)
            .eq('id', consultationId)
            .single();

        if (fetchError || !consultation) {
            return { success: false, message: 'Recording not found' };
        }

        // Verify ownership
        const appointment = Array.isArray(consultation.appointment)
            ? consultation.appointment[0]
            : consultation.appointment;

        if (appointment?.doctor_id !== user.id) {
            return { success: false, message: 'Unauthorized' };
        }

        // Delete from storage if URL exists
        if (consultation.audio_url) {
            const urlParts = consultation.audio_url.split('/');
            const filename = urlParts[urlParts.length - 1];

            await supabase.storage
                .from('recordings')
                .remove([filename]);
        }

        // Update consultation to remove audio_url (don't delete the whole consultation)
        const { error: updateError } = await supabase
            .from('consultations')
            .update({ audio_url: null, updated_at: new Date().toISOString() })
            .eq('id', consultationId);

        if (updateError) {
            return { success: false, message: `Failed to delete: ${updateError.message}` };
        }

        revalidatePath('/doctor/recording');

        return { success: true, message: 'Recording deleted successfully' };
    } catch (err: any) {
        console.error('deleteRecording error:', err);
        return { success: false, message: err.message || 'An unexpected error occurred' };
    }
}

/**
 * Generate a signed URL for secure download (for private buckets)
 * Since the bucket is public, this returns the public URL
 */
export async function getRecordingDownloadUrl(audioUrl: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        // For public buckets, just return the URL
        // For private buckets, you would use:
        // const { data } = await supabase.storage.from('recordings').createSignedUrl(path, 3600);

        return { success: true, url: audioUrl };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateAppointmentStatus(appointmentId: string, newStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, message: 'Not authenticated' };
        }

        // Verify the appointment belongs to the doctor
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select('doctor_id')
            .eq('id', appointmentId)
            .single();

        if (fetchError || !appointment) {
            return { success: false, message: 'Appointment not found' };
        }

        if (appointment.doctor_id !== user.id) {
            return { success: false, message: 'Unauthorized' };
        }

        // Update the status
        const { error: updateError } = await supabase
            .from('appointments')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId);

        if (updateError) {
            return { success: false, message: `Failed to update status: ${updateError.message}` };
        }

        revalidatePath(`/doctor/${appointmentId}`);
        revalidatePath('/doctor');

        return { success: true, message: 'Status updated successfully' };
    } catch (error: any) {
        console.error('updateAppointmentStatus error:', error);
        return { success: false, message: error.message || 'An unexpected error occurred' };
    }
}

export async function generateAISummary(consultationId: string) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, message: 'Not authenticated' };
        }

        // Fetch all consultation data needed for AI processing
        // This way Kestra doesn't need to access Supabase directly
        const { data: consultation, error: consultationError } = await supabase
            .from('consultations')
            .select(`
                id,
                appointment_id,
                transcript,
                doctor_notes,
                processing_status,
                appointment:appointments!inner (
                    id,
                    doctor_id,
                    notes
                )
            `)
            .eq('id', consultationId)
            .single();

        if (consultationError || !consultation) {
            return { success: false, message: 'Consultation not found' };
        }

        // Handle appointment relation (can be array or object)
        const appointment = Array.isArray(consultation.appointment)
            ? consultation.appointment[0]
            : consultation.appointment;

        if (!appointment || appointment.doctor_id !== user.id) {
            return { success: false, message: 'Unauthorized' };
        }

        // Check if already processing
        if (consultation.processing_status === 'processing') {
            return { success: false, message: 'AI Summary is already being generated' };
        }

        // Validate that we have a transcript
        if (!consultation.transcript || consultation.transcript.trim() === '') {
            return { success: false, message: 'No transcript available. Please transcribe the recording first.' };
        }

        // Update processing status to 'processing'
        const { error: updateError } = await supabase
            .from('consultations')
            .update({
                processing_status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', consultationId);

        if (updateError) {
            return { success: false, message: 'Failed to update processing status' };
        }

        // Trigger Kestra workflow with ALL the data
        // Kestra no longer needs to access Supabase
        const kestraUrl = process.env.KESTRA_URL || 'http://localhost:8080';
        const kestraWebhookKey = process.env.KESTRA_WEBHOOK_KEY || 'jhbjbdjk4654hs';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const callbackUrl = `${appUrl}/api/kestra/callback`;

        const webhookUrl = `${kestraUrl}/api/v1/executions/webhook/ai.workflows/ai_summary_workflow/${kestraWebhookKey}`;

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // All data Kestra needs for AI processing
                consultation_id: consultationId,
                transcript: consultation.transcript,
                doctor_notes: consultation.doctor_notes || '',
                appointment_notes: appointment.notes || '',
                callback_url: callbackUrl,
            }),
        });

        if (!response.ok) {
            // Revert processing status on failure
            await supabase
                .from('consultations')
                .update({
                    processing_status: 'failed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', consultationId);

            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('Kestra workflow trigger failed:', errorText);
            return { success: false, message: 'Failed to trigger AI summary generation' };
        }

        // Parse Kestra response to get execution_id
        // Kestra webhook returns: { id: "execution-id", namespace: "...", flowId: "...", ... }
        let kestraExecutionId: string | null = null;
        try {
            const kestraResponse = await response.json();
            kestraExecutionId = kestraResponse.id || null;
            console.log('Kestra execution started:', kestraExecutionId);
        } catch (parseError) {
            console.warn('Could not parse Kestra response:', parseError);
        }

        // Update consultation with Kestra execution ID
        if (kestraExecutionId) {
            const { error: execUpdateError } = await supabase
                .from('consultations')
                .update({
                    kestra_execution_id: kestraExecutionId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', consultationId);

            if (execUpdateError) {
                console.warn('Failed to store Kestra execution ID:', execUpdateError);
            }
        }

        revalidatePath(`/doctor/${consultation.appointment_id}`);
        revalidatePath('/doctor');

        return {
            success: true,
            message: 'AI Summary generation started successfully',
            kestra_execution_id: kestraExecutionId
        };
    } catch (error: any) {
        console.error('generateAISummary error:', error);

        // Attempt to revert processing status on unexpected error
        try {
            const supabase = await createClient();
            await supabase
                .from('consultations')
                .update({
                    processing_status: 'failed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', consultationId);
        } catch (revertError) {
            console.error('Failed to revert processing status:', revertError);
        }

        return { success: false, message: error.message || 'An unexpected error occurred' };
    }
}

export async function generateDoctorReport(appointmentId: string) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, message: 'Not authenticated' };
        }

        // TODO: Implement actual doctor report generation
        // For now, this is a placeholder

        return { success: false, message: 'Doctor Report generation is not yet implemented' };
    } catch (error: any) {
        console.error('generateDoctorReport error:', error);
        return { success: false, message: error.message || 'An unexpected error occurred' };
    }
}


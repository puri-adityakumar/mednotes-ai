'use server';

import { AssemblyAI } from "assemblyai";
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const client = new AssemblyAI({
    apiKey: "4021aa64fec84023b60331b1a0a23876",
});

export async function transcribeConsultation(consultationId: string) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, message: 'Not authenticated' };
        }

        // 2. Fetch Consultation Details
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
            return { success: false, message: 'Consultation not found' };
        }

        // 3. Verify Authorization
        const appointment = Array.isArray(consultation.appointment)
            ? consultation.appointment[0]
            : consultation.appointment;

        if (appointment?.doctor_id !== user.id) {
            return { success: false, message: 'Unauthorized' };
        }

        if (!consultation.audio_url) {
            return { success: false, message: 'No audio file found for this consultation' };
        }

        // 4. Update status to processing
        await supabase
            .from('consultations')
            .update({
                processing_status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', consultationId);

        // 5. Transcribe with AssemblyAI
        const params = {
            audio: consultation.audio_url,
            speech_models: ["universal"] as string[],
        };

        const transcript = await client.transcripts.transcribe(params);

        if (transcript.status === 'error') {
            await supabase
                .from('consultations')
                .update({
                    processing_status: 'failed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', consultationId);
            return { success: false, message: `Transcription failed: ${transcript.error}` };
        }

        // 6. Update Database with Transcript
        const { error: updateError } = await supabase
            .from('consultations')
            .update({
                transcript: transcript.text,
                processing_status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', consultationId);

        if (updateError) {
            return { success: false, message: `Failed to save transcript: ${updateError.message}` };
        }

        revalidatePath('/doctor/recording');
        return { success: true, message: 'Transcription completed successfully', transcript: transcript.text };

    } catch (error: any) {
        console.error('Transcription error:', error);

        // Attempt to reset status on crash
        try {
            const supabase = await createClient();
            await supabase
                .from('consultations')
                .update({
                    processing_status: 'failed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', consultationId);
        } catch (e) {
            // Ignore secondary error
        }

        return { success: false, message: error.message || 'An unexpected error occurred during transcription' };
    }
}


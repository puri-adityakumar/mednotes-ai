import { createAnonClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Kestra Callback Webhook
 * 
 * Receives AI processing results from Kestra workflow and updates Supabase.
 * Since Kestra doesn't access Supabase directly, this callback is responsible for:
 * 1. Updating the consultation with ai_summary and doctor_report
 * 2. Setting processing_status to 'completed' or 'failed'
 * 3. Revalidating pages to reflect the new data
 * 
 * NOTE: Uses anonymous client - RLS policies allow updates for consultations
 * with processing_status = 'processing'.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            consultation_id,
            ai_summary,
            doctor_report,
            status,
            error,
            execution_id,  // Kestra execution ID for tracking
            processed_at,
            failed_at
        } = body;

        console.log('Kestra callback received:', {
            consultation_id,
            execution_id,
            status,
            ai_summary_length: ai_summary?.length || 0,
            doctor_report_length: doctor_report?.length || 0
        });

        // Use anonymous client - RLS policies configured to allow callback updates
        const supabase = createAnonClient();

        if (status === 'completed') {
            // Update consultation with AI results
            const { error: updateError } = await supabase
                .from('consultations')
                .update({
                    ai_summary: ai_summary,
                    doctor_notes: doctor_report, // Store doctor report in doctor_notes field
                    processing_status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', consultation_id);

            if (updateError) {
                console.error('Failed to update consultation with AI results:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Failed to save AI results to database' },
                    { status: 500 }
                );
            }

            console.log('AI Summary saved to consultation:', consultation_id);

            // Get the appointment_id to revalidate the correct page
            const { data: consultation, error: fetchError } = await supabase
                .from('consultations')
                .select('appointment_id')
                .eq('id', consultation_id)
                .single();

            if (fetchError) {
                console.error('Failed to fetch consultation for revalidation:', fetchError);
                // Don't fail the request, the data is saved
            }

            if (consultation?.appointment_id) {
                // Revalidate the doctor page to show updated AI summary
                revalidatePath(`/doctor/${consultation.appointment_id}`);
                revalidatePath('/doctor');
                console.log('Page revalidated for appointment:', consultation.appointment_id);
            }

            return NextResponse.json({
                success: true,
                message: 'AI summary saved successfully',
                consultation_id,
                processing_status: 'completed'
            });

        } else if (status === 'failed') {
            console.error('AI Summary generation failed for consultation:', consultation_id);
            console.error('Error:', error);

            // Update processing status to failed
            const { error: updateError } = await supabase
                .from('consultations')
                .update({
                    processing_status: 'failed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', consultation_id);

            if (updateError) {
                console.error('Failed to update consultation status to failed:', updateError);
            }

            // Revalidate pages to show failed status
            const { data: consultation } = await supabase
                .from('consultations')
                .select('appointment_id')
                .eq('id', consultation_id)
                .single();

            if (consultation?.appointment_id) {
                revalidatePath(`/doctor/${consultation.appointment_id}`);
                revalidatePath('/doctor');
            }

            return NextResponse.json({
                success: false,
                message: 'AI summary generation failed',
                error,
                consultation_id
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Unknown status'
        }, { status: 400 });

    } catch (error: any) {
        console.error('Kestra callback error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: error.message
            },
            { status: 500 }
        );
    }
}


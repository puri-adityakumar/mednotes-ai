import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { consultation_id, ai_summary, doctor_report, status, error } = body;

        console.log('Kestra callback received:', { consultation_id, status });

        if (status === 'completed') {
            // AI summary is already updated in Supabase by the workflow
            // Optionally, you can store the doctor_report separately if needed

            console.log('AI Summary completed for consultation:', consultation_id);
            console.log('AI Summary length:', ai_summary?.length || 0);
            console.log('Doctor Report length:', doctor_report?.length || 0);

            // Get the appointment_id to revalidate the correct page
            const supabase = await createClient();
            const { data: consultation, error: fetchError } = await supabase
                .from('consultations')
                .select('appointment_id, processing_status')
                .eq('id', consultation_id)
                .single();

            if (fetchError) {
                console.error('Failed to fetch consultation:', fetchError);
                return NextResponse.json(
                    { success: false, error: 'Failed to fetch consultation' },
                    { status: 404 }
                );
            }

            if (consultation?.appointment_id) {
                // Revalidate the doctor page to show updated AI summary
                revalidatePath(`/doctor/${consultation.appointment_id}`);
                revalidatePath('/doctor');

                console.log('Page revalidated for appointment:', consultation.appointment_id);
            }

            return NextResponse.json({
                success: true,
                message: 'AI summary processed successfully',
                consultation_id,
                processing_status: consultation?.processing_status
            });

        } else if (status === 'failed') {
            console.error('AI Summary generation failed for consultation:', consultation_id);
            console.error('Error:', error);

            // Revalidate pages to show failed status
            const supabase = await createClient();
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


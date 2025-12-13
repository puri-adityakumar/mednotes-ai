import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppointmentDetailSidebar } from "@/components/patients/AppointmentDetailSidebar";
import { AuthNavbar } from "@/components/AuthNavbar";

export default async function AppointmentDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch appointment details
    const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
            id,
            appointment_date,
            status,
            notes,
            patient_id,
            doctor_id,
            doctor:profiles!doctor_id (
                first_name,
                last_name,
                specialization
            ),
            consultation:consultations (
                id,
                ai_summary,
                doctor_notes,
                transcript,
                processing_status
            )
        `)
        .eq('id', slug)
        .eq('patient_id', user.id) // Ensure patient can only view their own appointments
        .single();

    if (error || !appointment) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AuthNavbar />
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-red-500">Appointment not found</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            The requested appointment could not be loaded or you don't have access to it.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AuthNavbar />
            <main className="flex-1 overflow-y-auto">
                <div className="w-full p-8">
                    <div className="max-w-7xl mx-auto">
                        <AppointmentDetailSidebar appointment={appointment} />
                    </div>
                </div>
            </main>
        </div>
    );
}


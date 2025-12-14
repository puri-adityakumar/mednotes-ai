import { createClient } from "@/lib/supabase/server";
import { AppointmentListClient } from "./AppointmentListClient";

export async function AppointmentList() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch appointments with doctor details for the logged-in patient
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id,
            appointment_date,
            status,
            notes,
            profiles!doctor_id (
                first_name,
                last_name,
                specialization
            )
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false });

    if (error) {
        console.error("Error fetching appointments:", error);
        return <div>Error loading appointments</div>;
    }

    return <AppointmentListClient appointments={appointments || []} />;
}


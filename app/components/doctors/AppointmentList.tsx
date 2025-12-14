import { createClient } from "@/lib/supabase/server";
import { AppointmentListClient } from "./AppointmentListClient";

export async function AppointmentList() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch appointments with patient details
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id,
            appointment_date,
            status,
            notes,
            patient_id,
            patient:profiles!patient_id (
                first_name,
                last_name,
                date_of_birth
            )
        `)
        .eq('doctor_id', user.id)
        .order('appointment_date', { ascending: true });

    if (error) {
        console.error("Error fetching appointments:", error);
        return <div>Error loading appointments</div>;
    }

    const appointmentsWithPatients = appointments || [];

    return <AppointmentListClient appointments={appointmentsWithPatients} />;
}

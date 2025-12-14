import { createClient } from "@/lib/supabase/server";
import { AppointmentListClient } from "./AppointmentListClient";

export async function AppointmentList() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch appointments
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, notes, patient_id')
        .eq('doctor_id', user.id)
        .order('appointment_date', { ascending: true });

    if (error) {
        console.error("Error fetching appointments:", error);
        return <div>Error loading appointments</div>;
    }

    // Fetch patient details for each appointment
    const appointmentsWithPatients = await Promise.all(
        (appointments || []).map(async (appointment) => {
            const { data: patient } = await supabase
                .from('profiles')
                .select('first_name, last_name, date_of_birth')
                .eq('id', appointment.patient_id)
                .single();

            return {
                ...appointment,
                patient: patient || null
            };
        })
    );

    return <AppointmentListClient appointments={appointmentsWithPatients} />;
}

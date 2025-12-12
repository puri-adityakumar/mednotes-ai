'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileData = {
    first_name: string;
    last_name: string;
    specialization: string;
    doctor_id: string; // License ID
    phone?: string;
}

export async function updateDoctorProfile(formData: ProfileData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: formData.first_name,
                last_name: formData.last_name,
                specialization: formData.specialization,
                doctor_id: formData.doctor_id,
                phone: formData.phone,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) throw error;

        revalidatePath('/doctor');
        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { error: "Failed to update profile" };
    }
}

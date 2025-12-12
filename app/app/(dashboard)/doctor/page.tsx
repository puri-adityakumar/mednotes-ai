import Link from "next/link";
import { AuthNavbar } from "@/components/AuthNavbar";
import { DoctorProfile } from "@/components/doctors/DoctorProfile";
import { AppointmentList } from "@/components/doctors/AppointmentList";

export default function DoctorDashboard() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AuthNavbar />
            <main className="flex-1 overflow-y-auto">
                <div className="w-full p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex flex-col gap-2 mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Doctor Dashboard</h1>
                            <p className="text-gray-500 dark:text-gray-400">Welcome back, Dr. Wilson. Here's your schedule for today.</p>
                        </div>

                        <DoctorProfile />
                        <AppointmentList />
                    </div>
                </div>
            </main>
        </div>
    );
}

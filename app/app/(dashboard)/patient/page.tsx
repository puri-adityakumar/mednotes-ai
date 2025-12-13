import { AuthNavbar } from "@/components/AuthNavbar";
import { PatientProfile } from "@/components/patients/PatientProfile";
import { ActionButtons } from "@/components/patients/ActionButtons";
import { AppointmentList } from "@/components/patients/AppointmentList";

export default function PatientDashboard() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AuthNavbar />
            <main className="flex-1 overflow-y-auto">
                <div className="w-full p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex flex-col gap-2 mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Patient Dashboard</h1>
                            <p className="text-gray-500 dark:text-gray-400">Welcome back! Manage your appointments and health records.</p>
                        </div>

                        {/* Patient Profile and Action Buttons */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <PatientProfile />
                            </div>
                            <div>
                                <ActionButtons />
                            </div>
                        </div>

                        {/* Appointments List */}
                        <AppointmentList />
                    </div>
                </div>
            </main>
        </div>
    );
}

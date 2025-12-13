import Link from "next/link";
import { AuthNavbar } from "@/components/AuthNavbar";
import { DoctorProfile } from "@/components/doctors/DoctorProfile";
import { AppointmentList } from "@/components/doctors/AppointmentList";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export default function DoctorDashboard() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AuthNavbar />
            <main className="flex-1 overflow-y-auto">
                <div className="w-full p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Doctor Dashboard</h1>
                                <p className="text-gray-500 dark:text-gray-400">Welcome back, Dr. Wilson. Here's your schedule for today.</p>
                            </div>
                            <Link href="/doctor/recording">
                                <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all">
                                    <Mic className="w-4 h-4 mr-2" />
                                    New Recording
                                </Button>
                            </Link>
                        </div>

                        <DoctorProfile />
                        <AppointmentList />
                    </div>
                </div>
            </main>
        </div>
    );
}

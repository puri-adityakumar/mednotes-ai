import Link from "next/link";
import { AuthNavbar } from "@/components/AuthNavbar";
import { DashboardSidebar, patientMenuItems } from "@/components/DashboardSidebar";
import { DashboardContent } from "@/components/DashboardContent";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function PatientDashboard() {
    return (
        <SidebarProvider>
            <DashboardSidebar
                title="MedNotes AI"
                titleHref="/patient"
                titleColor="blue"  
                menuItems={patientMenuItems}
                activeColor="blue"
            />
            <SidebarInset className="flex flex-col min-h-svh">
                <DashboardContent>
                    <AuthNavbar />
                  
                    <div className="flex-1 overflow-y-auto">
                        <div className="w-full p-8">
                        <div className="mb-8 flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Dashboard</h1>
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                                P
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Stats Cards WIP */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 h-32 animate-pulse">
                                    <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded mb-4"></div>
                                    <div className="h-8 w-12 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
                            <span className="text-4xl mb-4">🏗️</span>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard Under Construction</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                                We are building the appointment management and medical record features.
                            </p>
                            <Link href="/patient/appointments/new" className="mt-6 text-blue-600 hover:underline">
                                Demo: Book Appointment (Coming Soon)
                            </Link>
                        </div>
                        </div>
                    </div>
                </DashboardContent>
            </SidebarInset>
            </SidebarProvider>
    );
}

import Link from "next/link";
import { AuthNavbar } from "@/components/AuthNavbar";
import { DashboardSidebar, doctorMenuItems } from "@/components/DashboardSidebar";
import { DashboardContent } from "@/components/DashboardContent";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DoctorDashboard() {
    return (
        <SidebarProvider>
            <DashboardSidebar
                title="MedNotes Pro"
                titleHref="/doctor"
                titleColor="teal"
                menuItems={doctorMenuItems}
                activeColor="teal"
            />
            <SidebarInset className="flex flex-col min-h-svh">
                <DashboardContent>
                    <AuthNavbar />
                  
                    <div className="flex-1 overflow-y-auto">
                        <div className="w-full p-8">
                        <div className="mb-8 flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Dashboard</h1>
                            <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                                DR
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Detailed Stats Cards WIP */}
                            {["Today's Visits", "Total Patients", "Avg Time", "Pending Reports"].map((label, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</div>
                                    <div className="h-8 w-16 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border-2 border-dashed border-gray-200 dark:border-zinc-700 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
                            <span className="text-4xl mb-4">🩺</span>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Clinical Tools Integration</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                                The consultation recording and AI summary interface is being developed.
                            </p>
                        </div>
                        </div>
                    </div>
                </DashboardContent>
            </SidebarInset>
            </SidebarProvider>
    );
}

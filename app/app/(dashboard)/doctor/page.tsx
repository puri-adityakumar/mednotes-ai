import Link from "next/link";

export default function DoctorDashboard() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 hidden md:flex flex-col">
                <div className="p-6">
                    <Link href="/" className="text-xl font-bold text-teal-600">MedNotes Pro</Link>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <div className="px-4 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-lg">
                        Dashboard
                    </div>
                    <div className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg">
                        Schedule
                    </div>
                    <div className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg">
                        Patients
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
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

                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-8 text-center min-h-[400px] flex flex-col items-center justify-center border-dashed border-2 border-gray-200 dark:border-zinc-700">
                    <span className="text-4xl mb-4">🩺</span>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Clinical Tools Integration</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                        The consultation recording and AI summary interface is being developed.
                    </p>
                </div>
            </main>
        </div>
    );
}

import { AuthNavbar } from "@/components/AuthNavbar";

export default function RecordingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AuthNavbar />
            <main className="flex-1 overflow-y-auto">
                <div className="w-full p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex flex-col gap-2 mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                Consultation Recording
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Record and manage your patient consultations.
                            </p>
                        </div>

                        {/* Placeholder for NewRecordingPanel - Phase 2 */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 shadow-sm">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <p className="text-lg font-medium mb-2">🎙️ New Recording Panel</p>
                                <p className="text-sm">Coming in Phase 2</p>
                            </div>
                        </div>

                        {/* Placeholder for RecordingsList - Phase 2 */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 shadow-sm">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <p className="text-lg font-medium mb-2">📋 Recordings List</p>
                                <p className="text-sm">Coming in Phase 2</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

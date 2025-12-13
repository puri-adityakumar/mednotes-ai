'use client';

import { useState } from 'react';
import { AuthNavbar } from "@/components/AuthNavbar";
import { NewRecordingPanel } from "@/components/doctors/NewRecordingPanel";
import { RecordingsList } from "@/components/doctors/RecordingsList";

export default function RecordingPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRecordingUploaded = () => {
        // Trigger refresh of recordings list
        setRefreshTrigger(prev => prev + 1);
    };

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

                        <NewRecordingPanel onRecordingUploaded={handleRecordingUploaded} />

                        <RecordingsList refreshTrigger={refreshTrigger} />
                    </div>
                </div>
            </main>
        </div>
    );
}


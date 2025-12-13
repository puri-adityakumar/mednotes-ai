'use client';

import { useState } from 'react';
import { NewRecordingPanel } from "@/components/doctors/NewRecordingPanel";
import { RecordingsList } from "@/components/doctors/RecordingsList";
import { Mic, FileAudio } from 'lucide-react';

export function RecordingContent() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRecordingUploaded = () => {
        // Trigger refresh of recordings list
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Page Header */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/25">
                            <Mic className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                                Consultation Recording
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Record and manage your patient consultations
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                                <Mic className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">New</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Recording</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                <FileAudio className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">All</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Recordings</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* New Recording Panel */}
                    <div className="lg:sticky lg:top-8 lg:self-start">
                        <NewRecordingPanel onRecordingUploaded={handleRecordingUploaded} />
                    </div>

                    {/* Recordings List */}
                    <div className="lg:min-h-[600px]">
                        <RecordingsList refreshTrigger={refreshTrigger} />
                    </div>
                </div>
            </div>
        </div>
    );
}

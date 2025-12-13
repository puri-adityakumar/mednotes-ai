'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileAudio, Download, Clock, User, Calendar, RefreshCw, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Recording {
    id: string;
    audio_url: string;
    duration_minutes: number | null;
    consultation_date: string;
    processing_status: string;
    appointment: {
        id: string;
        appointment_date: string;
        patient: {
            first_name: string | null;
            last_name: string | null;
        } | null;
    } | null;
}

interface RecordingsListProps {
    refreshTrigger?: number;
}

export function RecordingsList({ refreshTrigger }: RecordingsListProps) {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRecordings = async () => {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        const { data, error: fetchError } = await supabase
            .from('consultations')
            .select(`
                id,
                audio_url,
                duration_minutes,
                consultation_date,
                processing_status,
                appointment:appointments!appointment_id (
                    id,
                    appointment_date,
                    patient:profiles!patient_id (
                        first_name,
                        last_name
                    )
                )
            `)
            .not('audio_url', 'is', null)
            .order('consultation_date', { ascending: false });

        if (fetchError) {
            console.error('Error fetching recordings:', fetchError);
            setError('Failed to load recordings.');
        } else {
            // Transform the data to handle the nested structure
            const transformedData = (data || []).map((item: any) => ({
                ...item,
                appointment: Array.isArray(item.appointment) ? item.appointment[0] : item.appointment,
            }));
            setRecordings(transformedData);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRecordings();
    }, [refreshTrigger]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900';
            case 'processing':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900';
            case 'failed':
                return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900';
        }
    };

    const formatStatus = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const handleDownload = async (audioUrl: string, patientName: string) => {
        try {
            const response = await fetch(audioUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recording_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.webm`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download failed:', err);
            // Fallback: open in new tab
            window.open(audioUrl, '_blank');
        }
    };

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileAudio className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        Recordings ({recordings.length})
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        All your consultation recordings.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRecordings}
                    disabled={isLoading}
                    className="gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading recordings...
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">
                        {error}
                    </div>
                ) : recordings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <FileAudio className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">No recordings yet</p>
                        <p className="text-sm mt-1">Your consultation recordings will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {recordings.map((recording) => {
                            const patient = recording.appointment?.patient;
                            const patientName = patient
                                ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
                                : 'Unknown Patient';
                            const { date, time } = formatDate(recording.consultation_date);

                            return (
                                <div
                                    key={recording.id}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-200"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                                            <FileAudio className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                {patientName}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {date} at {time}
                                                </span>
                                                {recording.duration_minutes && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {recording.duration_minutes} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 sm:mt-0 flex items-center gap-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(recording.processing_status)}`}>
                                            {formatStatus(recording.processing_status)}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(recording.audio_url, '_blank')}
                                                className="gap-1"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                <span className="hidden sm:inline">Play</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleDownload(recording.audio_url, patientName)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white gap-1"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="hidden sm:inline">Download</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

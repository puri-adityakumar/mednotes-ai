'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Mic,
    Square,
    Upload,
    RotateCcw,
    Play,
    Pause,
    AlertCircle,
    Volume2,
    Radio
} from 'lucide-react';
import { useAudioRecorder, formatRecordingTime } from '@/hooks/useAudioRecorder';
import { createClient } from '@/lib/supabase/client';
import { createConsultationRecord, type AppointmentOption } from '@/app/actions/recordings';
import { toast } from 'sonner';

interface NewRecordingPanelProps {
    onRecordingUploaded?: () => void;
}

export function NewRecordingPanel({ onRecordingUploaded }: NewRecordingPanelProps) {
    const [appointments, setAppointments] = useState<AppointmentOption[]>([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const {
        recordingState,
        recordingTime,
        audioBlob,
        audioUrl,
        error: recordingError,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
    } = useAudioRecorder();

    // Fetch appointments
    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                appointment_date,
                status,
                profiles:patient_id (
                    first_name,
                    last_name
                )
            `)
            .in('status', ['in_progress', 'scheduled'])
            .order('appointment_date', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
            toast.error('Failed to load appointments');
        } else {
            const transformed: AppointmentOption[] = (data || []).map((apt: any) => {
                const patient = Array.isArray(apt.profiles) ? apt.profiles[0] : apt.profiles;
                return {
                    id: apt.id,
                    appointment_date: apt.appointment_date,
                    status: apt.status,
                    patient_name: patient
                        ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
                        : 'Unknown Patient',
                };
            });
            setAppointments(transformed);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Show error toast when recording error occurs
    useEffect(() => {
        if (recordingError) {
            toast.error(recordingError);
        }
    }, [recordingError]);

    const handleStartRecording = async () => {
        if (!selectedAppointmentId) {
            toast.warning('Please select an appointment first');
            return;
        }

        toast.promise(startRecording(), {
            loading: 'Requesting microphone access...',
            success: 'Recording started!',
            error: 'Failed to start recording',
        });
    };

    const handleStopRecording = () => {
        stopRecording();
        toast.info('Recording stopped. You can preview and upload.');
    };

    const handleUpload = async () => {
        if (!audioBlob || !selectedAppointmentId) {
            toast.error('Please select an appointment and record audio first.');
            return;
        }

        setIsUploading(true);

        const uploadToast = toast.loading('Uploading recording...');

        try {
            const supabase = createClient();

            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `recording_${selectedAppointmentId}_${timestamp}.webm`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('recordings')
                .upload(filename, audioBlob, {
                    contentType: 'audio/webm',
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('recordings')
                .getPublicUrl(filename);

            const audioPublicUrl = urlData.publicUrl;

            // Create consultation record via server action
            const result = await createConsultationRecord(
                selectedAppointmentId,
                audioPublicUrl,
                Math.ceil(recordingTime / 60)
            );

            if (!result.success) {
                throw new Error(result.message);
            }

            toast.success('Recording uploaded successfully!', {
                id: uploadToast,
                description: 'AI processing will begin shortly.',
            });

            resetRecording();
            setSelectedAppointmentId('');

            // Refresh appointments list (in case status changed)
            fetchAppointments();

            // Notify parent component
            onRecordingUploaded?.();

        } catch (err: any) {
            console.error('Upload error:', err);
            toast.error(err.message || 'Failed to upload recording', {
                id: uploadToast,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const formatAppointmentOption = (apt: AppointmentOption) => {
        const date = new Date(apt.appointment_date);
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const statusBadge = apt.status === 'in_progress' ? '🔴' : '🟡';

        return `${statusBadge} ${apt.patient_name} - ${dateStr} ${timeStr}`;
    };

    const getRecordingStateStyles = () => {
        switch (recordingState) {
            case 'recording':
                return {
                    timerColor: 'text-red-500',
                    bgColor: 'bg-red-50 dark:bg-red-900/10',
                    borderColor: 'border-red-200 dark:border-red-900/30',
                };
            case 'paused':
                return {
                    timerColor: 'text-amber-500',
                    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
                    borderColor: 'border-amber-200 dark:border-amber-900/30',
                };
            case 'stopped':
                return {
                    timerColor: 'text-green-500',
                    bgColor: 'bg-green-50 dark:bg-green-900/10',
                    borderColor: 'border-green-200 dark:border-green-900/30',
                };
            default:
                return {
                    timerColor: 'text-gray-400 dark:text-gray-500',
                    bgColor: 'bg-gray-50 dark:bg-zinc-800/50',
                    borderColor: 'border-gray-200 dark:border-zinc-700',
                };
        }
    };

    const styles = getRecordingStateStyles();

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                        <Mic className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    New Recording
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Select a patient appointment and record the consultation audio.
                </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Patient Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-teal-600" />
                        Select Patient Appointment
                    </label>
                    <Select
                        value={selectedAppointmentId}
                        onValueChange={setSelectedAppointmentId}
                        disabled={recordingState === 'recording' || recordingState === 'paused'}
                    >
                        <SelectTrigger className="w-full h-12 text-base">
                            <SelectValue placeholder={isLoading ? "Loading appointments..." : "Choose an appointment to record"} />
                        </SelectTrigger>
                        <SelectContent>
                            {appointments.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No ongoing or upcoming appointments found.
                                </div>
                            ) : (
                                appointments.map((apt) => (
                                    <SelectItem key={apt.id} value={apt.id} className="py-3">
                                        {formatAppointmentOption(apt)}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            In Progress
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Scheduled
                        </span>
                    </div>
                </div>

                {/* Recording Controls */}
                <div className={`flex flex-col items-center space-y-6 py-8 rounded-xl border-2 ${styles.bgColor} ${styles.borderColor} transition-all duration-300`}>
                    {/* Audio Visualizer Placeholder */}
                    {recordingState === 'recording' && (
                        <div className="flex items-center gap-1 h-12">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-full animate-pulse"
                                    style={{
                                        height: `${Math.random() * 32 + 16}px`,
                                        animationDelay: `${i * 0.1}s`,
                                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {recordingState !== 'recording' && (
                        <div className="flex items-center gap-1 h-12">
                            <Volume2 className={`w-8 h-8 ${recordingState === 'idle' ? 'text-gray-300 dark:text-gray-600' : 'text-green-500'}`} />
                        </div>
                    )}

                    {/* Timer Display */}
                    <div className={`text-6xl font-mono font-bold ${styles.timerColor} transition-colors duration-300`}>
                        {formatRecordingTime(recordingTime)}
                    </div>

                    {/* Recording State Indicator */}
                    <div className="flex items-center gap-2 text-sm font-medium">
                        {recordingState === 'recording' && (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="text-red-600 dark:text-red-400">Recording in progress...</span>
                            </>
                        )}
                        {recordingState === 'paused' && (
                            <>
                                <span className="w-3 h-3 bg-amber-500 rounded-full" />
                                <span className="text-amber-600 dark:text-amber-400">Recording paused</span>
                            </>
                        )}
                        {recordingState === 'stopped' && audioBlob && (
                            <>
                                <span className="w-3 h-3 bg-green-500 rounded-full" />
                                <span className="text-green-600 dark:text-green-400">Recording complete - Ready to upload</span>
                            </>
                        )}
                        {recordingState === 'idle' && (
                            <span className="text-gray-500 dark:text-gray-400">
                                {selectedAppointmentId ? 'Ready to record' : 'Select an appointment to begin'}
                            </span>
                        )}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center gap-4 pt-2">
                        {recordingState === 'idle' && (
                            <Button
                                size="lg"
                                onClick={handleStartRecording}
                                disabled={!selectedAppointmentId}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white gap-2 px-8 h-14 text-lg shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Mic className="w-6 h-6" />
                                Start Recording
                            </Button>
                        )}

                        {recordingState === 'recording' && (
                            <>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={pauseRecording}
                                    className="gap-2 h-12 px-6 border-2 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                >
                                    <Pause className="w-5 h-5" />
                                    Pause
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handleStopRecording}
                                    className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white gap-2 h-12 px-6"
                                >
                                    <Square className="w-5 h-5" />
                                    Stop Recording
                                </Button>
                            </>
                        )}

                        {recordingState === 'paused' && (
                            <>
                                <Button
                                    size="lg"
                                    onClick={resumeRecording}
                                    className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-12 px-6"
                                >
                                    <Play className="w-5 h-5" />
                                    Resume
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handleStopRecording}
                                    className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white gap-2 h-12 px-6"
                                >
                                    <Square className="w-5 h-5" />
                                    Stop Recording
                                </Button>
                            </>
                        )}

                        {recordingState === 'stopped' && audioBlob && (
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={resetRecording}
                                className="gap-2 h-12 px-6 border-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Start Over
                            </Button>
                        )}
                    </div>
                </div>

                {/* Audio Preview */}
                {audioUrl && recordingState === 'stopped' && (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Play className="w-4 h-4 text-teal-600" />
                            Preview Recording
                        </label>
                        <audio
                            controls
                            src={audioUrl}
                            className="w-full rounded-lg"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Duration: {formatRecordingTime(recordingTime)} • Format: WebM Audio
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {recordingError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900/30">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">Recording Error</p>
                            <p className="text-sm opacity-90">{recordingError}</p>
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                {audioBlob && recordingState === 'stopped' && (
                    <Button
                        size="lg"
                        onClick={handleUpload}
                        disabled={isUploading || !selectedAppointmentId}
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white gap-2 h-14 text-lg shadow-lg shadow-teal-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 disabled:opacity-50"
                    >
                        {isUploading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Uploading Recording...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Upload Recording
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

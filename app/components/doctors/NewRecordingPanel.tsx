'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Mic, Square, Upload, RotateCcw, Play, Pause, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAudioRecorder, formatRecordingTime } from '@/hooks/useAudioRecorder';
import { createClient } from '@/lib/supabase/client';

interface Appointment {
    id: string;
    appointment_date: string;
    status: string;
    profiles: {
        first_name: string | null;
        last_name: string | null;
    } | null;
}

interface NewRecordingPanelProps {
    onRecordingUploaded?: () => void;
}

export function NewRecordingPanel({ onRecordingUploaded }: NewRecordingPanelProps) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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

    // Fetch ongoing/upcoming appointments
    useEffect(() => {
        async function fetchAppointments() {
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
            } else {
                setAppointments(data || []);
            }
            setIsLoading(false);
        }

        fetchAppointments();
    }, []);

    const handleUpload = async () => {
        if (!audioBlob || !selectedAppointmentId) {
            setUploadError('Please select an appointment and record audio first.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

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

            // Check if consultation exists for this appointment
            const { data: existingConsultation } = await supabase
                .from('consultations')
                .select('id')
                .eq('appointment_id', selectedAppointmentId)
                .single();

            if (existingConsultation) {
                // Update existing consultation
                const { error: updateError } = await supabase
                    .from('consultations')
                    .update({
                        audio_url: audioPublicUrl,
                        duration_minutes: Math.ceil(recordingTime / 60),
                        processing_status: 'pending',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingConsultation.id);

                if (updateError) throw updateError;
            } else {
                // Create new consultation
                const { error: insertError } = await supabase
                    .from('consultations')
                    .insert({
                        appointment_id: selectedAppointmentId,
                        audio_url: audioPublicUrl,
                        duration_minutes: Math.ceil(recordingTime / 60),
                        processing_status: 'pending',
                        consultation_date: new Date().toISOString(),
                    });

                if (insertError) throw insertError;
            }

            // Update appointment status to in_progress if scheduled
            await supabase
                .from('appointments')
                .update({ status: 'in_progress' })
                .eq('id', selectedAppointmentId)
                .eq('status', 'scheduled');

            setUploadSuccess(true);
            resetRecording();
            setSelectedAppointmentId('');

            // Notify parent component
            onRecordingUploaded?.();

        } catch (err: any) {
            console.error('Upload error:', err);
            setUploadError(err.message || 'Failed to upload recording. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const formatAppointmentOption = (apt: Appointment) => {
        const patient = apt.profiles;
        const patientName = patient
            ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
            : 'Unknown Patient';
        const date = new Date(apt.appointment_date);
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const statusBadge = apt.status === 'in_progress' ? '🔴' : '🟡';

        return `${statusBadge} ${patientName} - ${dateStr} ${timeStr}`;
    };

    const getRecordingStateColor = () => {
        switch (recordingState) {
            case 'recording':
                return 'text-red-500';
            case 'paused':
                return 'text-amber-500';
            case 'stopped':
                return 'text-green-500';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-zinc-800">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mic className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    New Recording
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a patient and record the consultation audio.
                </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Patient Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Patient Appointment
                    </label>
                    <Select
                        value={selectedAppointmentId}
                        onValueChange={setSelectedAppointmentId}
                        disabled={recordingState === 'recording' || recordingState === 'paused'}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoading ? "Loading appointments..." : "Select an appointment"} />
                        </SelectTrigger>
                        <SelectContent>
                            {appointments.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No ongoing or upcoming appointments found.
                                </div>
                            ) : (
                                appointments.map((apt) => (
                                    <SelectItem key={apt.id} value={apt.id}>
                                        {formatAppointmentOption(apt)}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400">
                        🔴 In Progress &nbsp;&nbsp; 🟡 Scheduled
                    </p>
                </div>

                {/* Recording Controls */}
                <div className="flex flex-col items-center space-y-4 py-6 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    {/* Timer Display */}
                    <div className={`text-5xl font-mono font-bold ${getRecordingStateColor()}`}>
                        {formatRecordingTime(recordingTime)}
                    </div>

                    {/* Recording State Indicator */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        {recordingState === 'recording' && (
                            <>
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                Recording...
                            </>
                        )}
                        {recordingState === 'paused' && (
                            <>
                                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                                Paused
                            </>
                        )}
                        {recordingState === 'stopped' && audioBlob && (
                            <>
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                                Recording complete
                            </>
                        )}
                        {recordingState === 'idle' && 'Ready to record'}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center gap-3">
                        {recordingState === 'idle' && (
                            <Button
                                size="lg"
                                onClick={startRecording}
                                disabled={!selectedAppointmentId}
                                className="bg-red-600 hover:bg-red-700 text-white gap-2 px-6"
                            >
                                <Mic className="w-5 h-5" />
                                Start Recording
                            </Button>
                        )}

                        {recordingState === 'recording' && (
                            <>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={pauseRecording}
                                    className="gap-2"
                                >
                                    <Pause className="w-5 h-5" />
                                    Pause
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={stopRecording}
                                    className="bg-gray-800 hover:bg-gray-900 text-white gap-2"
                                >
                                    <Square className="w-5 h-5" />
                                    Stop
                                </Button>
                            </>
                        )}

                        {recordingState === 'paused' && (
                            <>
                                <Button
                                    size="lg"
                                    onClick={resumeRecording}
                                    className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                                >
                                    <Play className="w-5 h-5" />
                                    Resume
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={stopRecording}
                                    className="bg-gray-800 hover:bg-gray-900 text-white gap-2"
                                >
                                    <Square className="w-5 h-5" />
                                    Stop
                                </Button>
                            </>
                        )}

                        {recordingState === 'stopped' && audioBlob && (
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={resetRecording}
                                className="gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                New Recording
                            </Button>
                        )}
                    </div>
                </div>

                {/* Audio Preview */}
                {audioUrl && recordingState === 'stopped' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Preview Recording
                        </label>
                        <audio
                            controls
                            src={audioUrl}
                            className="w-full rounded-lg"
                        />
                    </div>
                )}

                {/* Error Display */}
                {(recordingError || uploadError) && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {recordingError || uploadError}
                    </div>
                )}

                {/* Success Message */}
                {uploadSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Recording uploaded successfully! Processing will begin shortly.
                    </div>
                )}

                {/* Upload Button */}
                {audioBlob && recordingState === 'stopped' && (
                    <Button
                        size="lg"
                        onClick={handleUpload}
                        disabled={isUploading || !selectedAppointmentId}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2"
                    >
                        {isUploading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Uploading...
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

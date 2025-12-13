'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileAudio,
    Download,
    Clock,
    User,
    Calendar,
    RefreshCw,
    ExternalLink,
    Trash2,
    MoreVertical,
    PlayCircle,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { deleteRecording, type Recording } from '@/app/actions/recordings';
import { toast } from 'sonner';

interface RecordingsListProps {
    refreshTrigger?: number;
}

export function RecordingsList({ refreshTrigger }: RecordingsListProps) {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchRecordings = useCallback(async () => {
        setIsLoading(true);

        const supabase = createClient();

        const { data, error } = await supabase
            .from('consultations')
            .select(`
                id,
                audio_url,
                duration_minutes,
                consultation_date,
                processing_status,
                transcript,
                ai_summary,
                appointment:appointments!appointment_id (
                    id,
                    appointment_date,
                    status,
                    patient:profiles!patient_id (
                        first_name,
                        last_name,
                        email
                    )
                )
            `)
            .not('audio_url', 'is', null)
            .order('consultation_date', { ascending: false });

        if (error) {
            console.error('Error fetching recordings:', error);
            toast.error('Failed to load recordings');
        } else {
            const transformedData = (data || []).map((item: any) => ({
                ...item,
                appointment: Array.isArray(item.appointment) ? item.appointment[0] : item.appointment,
            }));
            setRecordings(transformedData);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchRecordings();
    }, [fetchRecordings, refreshTrigger]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        let relativeDate = '';
        if (diffDays === 0) {
            relativeDate = 'Today';
        } else if (diffDays === 1) {
            relativeDate = 'Yesterday';
        } else if (diffDays < 7) {
            relativeDate = `${diffDays} days ago`;
        } else {
            relativeDate = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }

        return {
            date: date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            relative: relativeDate,
        };
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
                    icon: CheckCircle2,
                    label: 'Processed',
                };
            case 'processing':
                return {
                    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
                    icon: Loader2,
                    label: 'Processing',
                    animate: true,
                };
            case 'failed':
                return {
                    color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
                    icon: AlertCircle,
                    label: 'Failed',
                };
            default:
                return {
                    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
                    icon: Clock,
                    label: 'Pending',
                };
        }
    };

    const handleDownload = async (audioUrl: string, patientName: string) => {
        const downloadToast = toast.loading('Preparing download...');

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

            toast.success('Download started!', { id: downloadToast });
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Download failed. Opening in new tab...', { id: downloadToast });
            window.open(audioUrl, '_blank');
        }
    };

    const handleDelete = async (recording: Recording) => {
        const patient = recording.appointment?.patient;
        const patientName = patient
            ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
            : 'Unknown Patient';

        toast.promise(
            async () => {
                setDeletingId(recording.id);
                const result = await deleteRecording(recording.id);

                if (!result.success) {
                    throw new Error(result.message);
                }

                // Remove from local state
                setRecordings(prev => prev.filter(r => r.id !== recording.id));
                setDeletingId(null);

                return result;
            },
            {
                loading: `Deleting recording for ${patientName}...`,
                success: 'Recording deleted successfully',
                error: (err) => {
                    setDeletingId(null);
                    return err.message || 'Failed to delete recording';
                },
            }
        );
    };

    const handlePlay = (audioUrl: string) => {
        window.open(audioUrl, '_blank');
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-100 dark:border-zinc-800">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileAudio className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        Recordings
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-zinc-800 flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 dark:from-zinc-900 dark:to-zinc-800">
                <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                            <FileAudio className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        Recordings
                        <Badge variant="secondary" className="ml-2 text-xs">
                            {recordings.length}
                        </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        All your consultation recordings
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRecordings}
                    disabled={isLoading}
                    className="gap-2 shrink-0"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {recordings.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                            <FileAudio className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No recordings yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Your consultation recordings will appear here after you record and upload them.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {recordings.map((recording) => {
                            const patient = recording.appointment?.patient;
                            const patientName = patient
                                ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
                                : 'Unknown Patient';
                            const { date, time, relative } = formatDate(recording.consultation_date);
                            const statusConfig = getStatusConfig(recording.processing_status);
                            const StatusIcon = statusConfig.icon;
                            const isDeleting = deletingId === recording.id;

                            return (
                                <div
                                    key={recording.id}
                                    className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all duration-200 ${isDeleting ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                                            {patientName.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-1.5 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                <User className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="truncate">{patientName}</span>
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="hidden sm:inline">{date}</span>
                                                    <span className="sm:hidden">{relative}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                                    {time}
                                                </span>
                                                {recording.duration_minutes && (
                                                    <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                                                        <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                                        {recording.duration_minutes} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 sm:mt-0 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                                        {/* Status Badge */}
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                            <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                                            {statusConfig.label}
                                        </span>

                                        {/* Action Buttons - Desktop */}
                                        <div className="hidden sm:flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handlePlay(recording.audio_url)}
                                                className="gap-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Play
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleDownload(recording.audio_url, patientName)}
                                                className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </Button>
                                        </div>

                                        {/* Dropdown Menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    disabled={isDeleting}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => handlePlay(recording.audio_url)}
                                                    className="gap-2 cursor-pointer sm:hidden"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Play Recording
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDownload(recording.audio_url, patientName)}
                                                    className="gap-2 cursor-pointer sm:hidden"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="sm:hidden" />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(recording)}
                                                    className="gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete Recording
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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

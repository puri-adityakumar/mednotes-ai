'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { updateAppointmentStatus, generateAISummary, generateDoctorReport } from '@/lib/appointments';
import { toast } from 'sonner';
import { Loader2, Sparkles, FileText } from 'lucide-react';

interface AppointmentActionsProps {
    appointmentId: string;
    initialStatus: string;
    consultationId?: string | null;
}

export function AppointmentActions({ appointmentId, initialStatus, consultationId }: AppointmentActionsProps) {
    const [status, setStatus] = useState(initialStatus);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdatingStatus(true);
        const result = await updateAppointmentStatus(appointmentId, newStatus as any);

        if (result.success) {
            setStatus(newStatus);
            toast.success('Status updated successfully');
        } else {
            toast.error(result.message);
        }
        setIsUpdatingStatus(false);
    };

    const handleGenerateSummary = async () => {
        if (!consultationId) {
            toast.error('No consultation found');
            return;
        }

        setIsGeneratingSummary(true);
        const result = await generateAISummary(consultationId);

        if (result.success) {
            toast.success('AI Summary generated successfully');
        } else {
            toast.error(result.message);
        }
        setIsGeneratingSummary(false);
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        const result = await generateDoctorReport(appointmentId);

        if (result.success) {
            toast.success('Doctor Report generated successfully');
        } else {
            toast.info(result.message);
        }
        setIsGeneratingReport(false);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 p-6 bg-gray-50/50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="w-full sm:max-w-xs space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    Appointment Status
                </label>
                <Select value={status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                    <SelectTrigger className="h-11 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 focus:ring-teal-500/20 transition-all font-medium">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary || !consultationId}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border-0 h-11 px-6 rounded-lg transition-all"
            >
                {isGeneratingSummary ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Report
            </Button>
        </div>
    );
}


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
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                    Appointment Status
                </label>
                <Select value={status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                    <SelectTrigger className="w-full">
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

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary || !consultationId}
                    className="gap-2"
                >
                    {isGeneratingSummary ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    Generate AI Summary
                </Button>

                <Button
                    variant="outline"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="gap-2"
                >
                    {isGeneratingReport ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="h-4 w-4" />
                    )}
                    Doctor Report
                </Button>
            </div>
        </div>
    );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageResponse } from "@/components/ai-elements/message";
import { normalizeMarkdown } from "@/lib/markdown";
import { ClipboardList } from "lucide-react";

interface DoctorReportTabProps {
    consultation: any;
}

export function DoctorReportTab({ consultation }: DoctorReportTabProps) {
    const hasConsultation = consultation && Array.isArray(consultation) ? consultation[0] : consultation;
    const doctorNotes = hasConsultation?.doctor_notes;
    const doctorNotesMarkdown = normalizeMarkdown(doctorNotes);

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-zinc-800">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-teal-600" />
                    Doctor Report
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Official doctor's notes and report
                </p>
            </CardHeader>
            <CardContent className="p-6">
                {!hasConsultation ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="font-semibold mb-2">Pending</p>
                        <p className="text-sm">No consultation record available yet.</p>
                    </div>
                ) : !doctorNotes ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="font-semibold mb-2">Pending</p>
                        <p className="text-sm">The doctor's report is not available yet.</p>
                        <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                            This will be updated by your doctor after the consultation.
                        </p>
                    </div>
                ) : (
                    <div className="prose dark:prose-invert max-w-none">
                        <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Doctor's Notes
                            </h3>
                            <MessageResponse className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {doctorNotesMarkdown}
                            </MessageResponse>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


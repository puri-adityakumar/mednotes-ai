import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";

interface ConsultationSummaryTabProps {
    consultation: any;
}

export function ConsultationSummaryTab({ consultation }: ConsultationSummaryTabProps) {
    const hasConsultation = consultation && Array.isArray(consultation) ? consultation[0] : consultation;
    const summary = hasConsultation?.ai_summary;
    const processingStatus = hasConsultation?.processing_status;

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-zinc-800">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Consultation Summary
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    AI-generated summary of your consultation
                </p>
            </CardHeader>
            <CardContent className="p-6">
                {!hasConsultation ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p>No consultation record available yet.</p>
                        <p className="text-sm mt-2">This will appear after your consultation is completed.</p>
                    </div>
                ) : processingStatus === 'pending' || processingStatus === 'processing' ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Generating summary...</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                            The consultation summary is being processed and will appear here shortly.
                        </p>
                    </div>
                ) : !summary ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="font-semibold mb-2">Pending</p>
                        <p className="text-sm">The consultation summary is not available yet.</p>
                    </div>
                ) : (
                    <div className="prose dark:prose-invert max-w-none">
                        <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {summary}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


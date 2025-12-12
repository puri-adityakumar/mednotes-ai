import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, FileText, Activity, Clock, FileAudio, FileCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppointmentDetailsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch appointment detail
    const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
            id,
            appointment_date,
            status,
            notes,
            patient:profiles!patient_id (
                first_name,
                last_name,
                date_of_birth,
                phone,
                email
            ),
            consultation:consultations (
                id,
                ai_summary,
                transcript,
                doctor_notes,
                duration_minutes,
                processing_status
            )
        `)
        .eq('id', slug)
        .single();

    if (error || !appointment) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-red-500">Appointment not found</h1>
                <p className="text-gray-500">The requested appointment could not be loaded.</p>
                <Link href="/doctor">
                    <Button variant="outline" className="mt-4">Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    // Safely handle patient relation if it returns array or object (Supabase quirk sometimes depending on relation setup)
    const rawPatient = appointment.patient;
    const patient = Array.isArray(rawPatient) ? rawPatient[0] : rawPatient;

    // Safely handle consultation relation
    const rawConsultation = appointment.consultation;
    // consultations is usually 1:1 with appointment via appointment_id unique constraint, but could be null
    const consultation = Array.isArray(rawConsultation) ? rawConsultation[0] : rawConsultation;

    const patientName = patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient' : 'Unknown Patient';
    const dob = patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A';

    // Date formatting
    const aptDate = new Date(appointment.appointment_date);
    const dateStr = aptDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = aptDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    // Status Badge Color
    const getStatusColor = (s: string) => {
        switch (s.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
            default: return 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Link href="/doctor">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Appointment Details</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {appointment.id}</p>
                </div>
                <div className="ml-auto">
                    <Badge variant="outline" className={`text-sm py-1 px-3 border ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Patient & Appointment Info */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Patient Info */}
                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <User className="h-4 w-4 text-teal-600" />
                                Patient Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Full Name</span>
                                <p className="font-medium text-gray-900 dark:text-gray-200 text-lg">{patientName}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Contact</span>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{patient?.email || 'No email'}</p>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{patient?.phone || 'No phone'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Date of Birth</span>
                                <p className="text-gray-700 dark:text-gray-300">{dob}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointment Info */}
                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-teal-600" />
                                Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Date</span>
                                <span className="font-medium text-sm">{dateStr}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Time</span>
                                <span className="font-medium text-sm">{timeStr}</span>
                            </div>
                            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
                                {consultation ? (
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                                        Consultation Recorded
                                    </Button>
                                ) : (
                                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                                        Start Consultation
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Consultation / Report */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Notes Section - Always visible */}
                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                Appointment Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {appointment.notes || "No notes provided for this appointment."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Consultation Report Section */}
                    {consultation ? (
                        <div className="space-y-6">
                            {consultation.processing_status === 'pending' || consultation.processing_status === 'processing' ? (
                                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900">
                                    <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                                        <Activity className="h-8 w-8 text-amber-600 animate-pulse" />
                                        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">Generating Report...</h3>
                                        <p className="text-sm text-amber-600 dark:text-amber-400">
                                            The consultation audio is being processed. Summary and insights will appear here shortly.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                                        <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800 bg-teal-50/30 dark:bg-teal-900/10">
                                            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-teal-800 dark:text-teal-200">
                                                <FileCheck className="h-5 w-5" />
                                                AI Consultation Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase mb-2">Summary</h4>
                                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm bg-gray-50 dark:bg-zinc-900 p-4 rounded-md border border-gray-100 dark:border-zinc-800">
                                                    {consultation.ai_summary || "No summary generated."}
                                                </div>
                                            </div>

                                            {consultation.doctor_notes && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase mb-2">My Notes</h4>
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{consultation.doctor_notes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Transcript Accordion style or simple view */}
                                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                                        <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
                                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                <FileAudio className="h-4 w-4 text-gray-600" />
                                                Transcript
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="max-h-60 overflow-y-auto text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-zinc-900 rounded border border-gray-100 dark:border-zinc-800 whitespace-pre-wrap">
                                                {consultation.transcript || "No transcript available."}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    ) : (
                        // No consultation yet
                        <Card className="border-dashed border-2 border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Consultation Not Started</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        There are no consultation records or reports for this appointment yet.
                                    </p>
                                </div>
                                <Button className="bg-teal-600 hover:bg-teal-700">Begin Consultation Session</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

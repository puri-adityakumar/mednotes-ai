import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, FileText, Activity, Clock, FileAudio, FileCheck, Info } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppointmentActions } from "@/components/doctors/AppointmentActions";

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
            patient_id,
            patient:profiles!patient_id (
                id,
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

    // Safely handle patient relation
    const rawPatient = appointment.patient;
    const patient = Array.isArray(rawPatient) ? rawPatient[0] : rawPatient;

    // Safely handle consultation relation
    const rawConsultation = appointment.consultation;
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
            case 'completed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300';
            default: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/doctor">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Appointment Details</h1>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="font-semibold">Appointment ID:</span> {appointment.id}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <span className="font-semibold">Patient ID:</span> {appointment.patient_id}
                        </span>
                        {consultation && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <span className="font-semibold">Consultation ID:</span> {consultation.id}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <Badge variant="outline" className={`text-sm py-1 px-3 border ${getStatusColor(appointment.status)}`}>
                    {appointment.status.replace('_', ' ').toUpperCase()}
                </Badge>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="consultation">Consultation</TabsTrigger>
                    <TabsTrigger value="notes">Doctor Notes</TabsTrigger>
                    <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Patient & Appointment Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Patient Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm uppercase">Patient Information</span>
                                    </div>
                                    <div className="space-y-3 pl-6">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Full Name</span>
                                            <p className="font-medium text-gray-900 dark:text-gray-200">{patientName}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Contact</span>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{patient?.email || 'No email'}</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{patient?.phone || 'No phone'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase font-semibold block mb-1">Date of Birth</span>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{dob}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-sm uppercase">Schedule</span>
                                    </div>
                                    <div className="space-y-3 pl-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Date</span>
                                            <span className="font-medium text-sm text-gray-900 dark:text-gray-200">{dateStr}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Time</span>
                                            <span className="font-medium text-sm text-gray-900 dark:text-gray-200">{timeStr}</span>
                                        </div>
                                        {consultation && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Duration</span>
                                                <span className="font-medium text-sm text-gray-900 dark:text-gray-200">
                                                    {consultation.duration_minutes ? `${consultation.duration_minutes} min` : 'N/A'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Notes */}
                            {appointment.notes && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-semibold mb-3">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm uppercase">Appointment Notes</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-6">
                                        {appointment.notes}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-4 border-t">
                                <AppointmentActions
                                    appointmentId={appointment.id}
                                    initialStatus={appointment.status}
                                    consultationId={consultation?.id}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Consultation Tab */}
                <TabsContent value="consultation" className="space-y-6">
                    {consultation ? (
                        <>
                            {consultation.processing_status === 'pending' || consultation.processing_status === 'processing' ? (
                                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900">
                                    <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-3">
                                        <Activity className="h-12 w-12 text-amber-600 animate-pulse" />
                                        <h3 className="text-xl font-semibold text-amber-800 dark:text-amber-200">Generating Report...</h3>
                                        <p className="text-sm text-amber-600 dark:text-amber-400 max-w-md">
                                            The consultation audio is being processed. Summary and insights will appear here shortly.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    {/* AI Summary */}
                                    <Card>
                                        <CardHeader className="bg-teal-50/30 dark:bg-teal-900/10">
                                            <CardTitle className="text-lg flex items-center gap-2 text-teal-800 dark:text-teal-200">
                                                <FileCheck className="h-5 w-5" />
                                                AI Consultation Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm bg-gray-50 dark:bg-zinc-900 p-6 rounded-md border border-gray-100 dark:border-zinc-800">
                                                {consultation.ai_summary || "No summary generated."}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Transcript */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <FileAudio className="h-4 w-4" />
                                                Transcript
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="max-h-96 overflow-y-auto text-sm text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-zinc-900 rounded border border-gray-100 dark:border-zinc-800 whitespace-pre-wrap font-mono">
                                                {consultation.transcript || "No transcript available."}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </>
                    ) : (
                        <Card className="border-dashed border-2">
                            <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <Clock className="h-8 w-8 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Consultation Not Started</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        There are no consultation records or reports for this appointment yet.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Doctor Notes Tab */}
                <TabsContent value="notes" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Doctor Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {consultation?.doctor_notes ? (
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                                    {consultation.doctor_notes}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Info className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No doctor notes available.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reports Tab (Disabled for now) */}
                <TabsContent value="reports">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-gray-500">Reports feature coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

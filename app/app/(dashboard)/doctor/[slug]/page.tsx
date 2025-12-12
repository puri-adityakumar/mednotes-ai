import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, FileText } from "lucide-react";
import Link from "next/link";

export default async function AppointmentDetailsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Mock data derivation from slug
    // Expected slug format: firstname-lastname-id
    const parts = slug.split('-');
    const nameParts = parts.slice(0, -1);
    const patientName = nameParts.length > 0
        ? nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
        : "Unknown Patient";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/doctor">
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Appointment Details</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View and manage patient appointment</p>
                </div>
                <div className="ml-auto">
                    <Badge variant="outline" className="text-sm py-1 px-3 bg-white dark:bg-zinc-900">
                        ID: {parts[parts.length - 1] || 'Unknown'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <Card className="md:col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-teal-600" />
                            Patient Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">Full Name</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200 text-lg">{patientName}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">Contact</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">+1 (555) 123-4567</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">Date of Birth</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">Jan 12, 1985</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">Blood Group</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">O+</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Card */}
                <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-teal-600" />
                            Appointment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Status</span>
                            <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 border-0">Confirmed</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Date</span>
                            <span className="font-medium">Dec 12, 2024</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Time</span>
                            <span className="font-medium">09:00 AM</span>
                        </div>
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
                            <Button className="w-full bg-teal-600 hover:bg-teal-700">Start Consultation</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-teal-600" />
                        Note
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-gray-500 dark:text-gray-400">Regular checkup initiated by patient.</p>
                </CardContent>
            </Card>
        </div>
    );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowRight, Activity, CalendarDays } from "lucide-react";

// Dummy data for appointments
const appointments = [
    {
        id: "1",
        patientName: "Alex Morgan",
        age: 34,
        gender: "Male",
        time: "09:00 AM",
        date: "Today, 12 Dec",
        type: "Follow-up",
        status: "Upcoming",
        slug: "alex-morgan-1",
    },
    {
        id: "2",
        patientName: "Emily Blunt",
        age: 28,
        gender: "Female",
        time: "10:30 AM",
        date: "Today, 12 Dec",
        type: "Consultation",
        status: "In Progress",
        slug: "emily-blunt-2",
    },
    {
        id: "3",
        patientName: "John Doe",
        age: 45,
        gender: "Male",
        time: "02:00 PM",
        date: "Today, 12 Dec",
        type: "Routine Checkup",
        status: "Scheduled",
        slug: "john-doe-3",
    },
    {
        id: "4",
        patientName: "Sarah Connor",
        age: 52,
        gender: "Female",
        time: "04:15 PM",
        date: "Today, 12 Dec",
        type: "Emergency",
        status: "Scheduled",
        slug: "sarah-connor-4",
    },
];

export function AppointmentList() {
    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        Upcoming Appointments
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">You have {appointments.length} appointments scheduled for today.</p>
                </div>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                    View Calendar
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {appointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-200"
                        >
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-lg shrink-0">
                                    {appointment.patientName.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        {appointment.patientName}
                                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                            {appointment.age} yrs, {appointment.gender}
                                        </span>
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-teal-500" />
                                            {appointment.time}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-orange-500" />
                                            {appointment.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-0 flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border
                    ${appointment.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900' : ''}
                    ${appointment.status === 'Upcoming' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900' : ''}
                    ${appointment.status === 'Scheduled' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' : ''}
                `}>
                                    {appointment.status}
                                </div>
                                <Link href={`/doctor/${appointment.slug}`}>
                                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm gap-1 group-hover:translate-x-1 transition-all">
                                        View
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

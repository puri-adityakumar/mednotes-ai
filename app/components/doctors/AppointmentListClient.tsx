'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Activity, ArrowRight, CalendarDays, Filter } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function AppointmentListClient({ appointments }: { appointments: any[] }) {
    const [filter, setFilter] = useState('all');

    const filteredAppointments = appointments.filter(app => {
        if (filter === 'all') return true;
        return app.status === filter;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            dateDisplay: date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
        };
    };

    const calculateAge = (dobString: string | null) => {
        if (!dobString) return "N/A";
        const dob = new Date(dobString);
        const diffMs = Date.now() - dob.getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900';
            case 'scheduled':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900';
            case 'completed':
                return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        Appointments ({filteredAppointments.length})
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your patient schedule.</p>
                </div>

                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {filteredAppointments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No appointments found for this filter.
                        </div>
                    ) : (
                        filteredAppointments.map((appointment) => {
                            const patient = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient;
                            const patientName = patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient' : 'Unknown Patient';
                            const { time, dateDisplay } = formatDate(appointment.appointment_date);
                            const age = calculateAge(patient?.date_of_birth);

                            return (
                                <div
                                    key={appointment.id}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-200"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-lg shrink-0">
                                            {patientName.charAt(0)}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                {patientName}
                                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded-full">
                                                    {age} yrs
                                                </span>
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-teal-500" />
                                                    {time}, {dateDisplay}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Activity className="w-4 h-4 text-orange-500" />
                                                    Consultation
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 sm:mt-0 flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                            {formatStatus(appointment.status)}
                                        </div>
                                        <Link href={`/doctor/${appointment.id}`}>
                                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm gap-1 group-hover:translate-x-1 transition-all">
                                                View
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

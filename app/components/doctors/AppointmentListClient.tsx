'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Activity, ArrowRight, CalendarDays, Filter } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

    const getStatusClassName = (status: string) => {
        switch (status.toLowerCase()) {
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-300 border-transparent';
            case 'scheduled':
                return 'bg-amber-100 text-amber-700 hover:bg-amber-100/80 dark:bg-amber-900/30 dark:text-amber-300 border-transparent';
            case 'completed':
                return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent';
            default:
                return 'bg-gray-100 text-gray-700 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg mt-8 transition-shadow hover:shadow-xl">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800 space-y-4 sm:space-y-0 p-6">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        Appointments <span className="text-gray-400 font-normal text-lg">({filteredAppointments.length})</span>
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your patient schedule and consultations.</p>
                </div>

                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
                        <Filter className="w-4 h-4 mr-2 text-gray-500" />
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
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 bg-gray-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                                <CalendarDays className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No appointments found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                                There are no appointments matching the selected filter status at this time.
                            </p>
                        </div>
                    ) : (
                        filteredAppointments.map((appointment) => {
                            // Fix: Access the nested 'patient' object correctly
                            // The server component now returns 'patient' (singular) via the alias in the query
                            const patient = appointment.patient || appointment.profiles;
                            const patientName = patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient' : 'Unknown Patient';
                            const { time, dateDisplay } = formatDate(appointment.appointment_date);
                            const age = calculateAge(patient?.date_of_birth);

                            return (
                                <div
                                    key={appointment.id}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-all duration-200"
                                >
                                    <div className="flex items-start gap-5">
                                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-100 to-blue-50 dark:from-teal-900/40 dark:to-blue-900/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xl shrink-0 border border-teal-100 dark:border-teal-900/50 shadow-sm">
                                            {patientName.charAt(0)}
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                    {patientName}
                                                </h3>
                                                <Badge variant="outline" className="font-normal text-xs text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                                                    {age} yrs
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5 min-w-[140px]">
                                                    <Clock className="w-4 h-4 text-teal-500" />
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{time}</span>
                                                    <span className="text-gray-400">|</span>
                                                    {dateDisplay}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Activity className="w-4 h-4 text-orange-500" />
                                                    Consultation
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 sm:mt-0 flex items-center gap-4 pl-[4.5rem] sm:pl-0">
                                        <Badge
                                            variant="outline"
                                            className={cn("px-3 py-1 text-xs font-semibold uppercase tracking-wider border-0", getStatusClassName(appointment.status))}
                                        >
                                            {formatStatus(appointment.status)}
                                        </Badge>

                                        <Link href={`/doctor/${appointment.id}`}>
                                            <Button size="sm" className="bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 hover:bg-teal-50 dark:hover:bg-zinc-700 hover:text-teal-700 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-teal-700 transition-all shadow-sm">
                                                View Details
                                                <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
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

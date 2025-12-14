'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, ClipboardList, Bot } from "lucide-react";
import { ChatHistoryTab } from "./ChatHistoryTab";
import { ConsultationSummaryTab } from "./ConsultationSummaryTab";
import { DoctorReportTab } from "./DoctorReportTab";
import { AIChatTab } from "./AIChatTab";

interface AppointmentDetailSidebarProps {
    appointment: any;
    chatId?: string | null;
}

type TabValue = 'chat-history' | 'consultation-summary' | 'doctor-report' | 'ai-chat';

export function AppointmentDetailSidebar({ appointment, chatId }: AppointmentDetailSidebarProps) {
    const [activeTab, setActiveTab] = useState<TabValue>('chat-history');

    const tabs = [
        { id: 'chat-history' as TabValue, label: 'Chat History', icon: MessageSquare },
        { id: 'consultation-summary' as TabValue, label: 'Consultation Summary', icon: FileText },
        { id: 'doctor-report' as TabValue, label: 'Doctor Report', icon: ClipboardList },
        { id: 'ai-chat' as TabValue, label: 'AI Chat', icon: Bot },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Navigation */}
            <div className="lg:col-span-1">
                <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? "default" : "ghost"}
                                    className={`w-full justify-start gap-2 ${
                                        activeTab === tab.id
                                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                                    }`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </Button>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-3">
                {activeTab === 'chat-history' && (
                    <ChatHistoryTab appointmentId={appointment.id} chatId={chatId || undefined} />
                )}
                {activeTab === 'consultation-summary' && (
                    <ConsultationSummaryTab consultation={appointment.consultation} />
                )}
                {activeTab === 'doctor-report' && (
                    <DoctorReportTab consultation={appointment.consultation} />
                )}
                {activeTab === 'ai-chat' && (
                    <AIChatTab appointment={appointment} userType="patient" />
                )}
            </div>
        </div>
    );
}


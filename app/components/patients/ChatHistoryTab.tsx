'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Loader2 } from "lucide-react";

interface ChatHistoryTabProps {
    appointmentId: string;
}

interface ChatMessage {
    id: string;
    message: string;
    ai_response: string;
    created_at: string;
}

export function ChatHistoryTab({ appointmentId }: ChatHistoryTabProps) {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchChatHistory() {
            try {
                setIsLoading(true);
                setError(null);
                const supabase = createClient();

                const { data, error: fetchError } = await supabase
                    .from('booking_chat')
                    .select('*')
                    .eq('appointment_id', appointmentId)
                    .order('created_at', { ascending: true });

                if (fetchError) {
                    console.error('Error fetching chat history:', fetchError);
                    setError('Failed to load chat history');
                } else {
                    setChatMessages(data || []);
                }
            } catch (err) {
                console.error('Error fetching chat history:', err);
                setError('Failed to load chat history');
            } finally {
                setIsLoading(false);
            }
        }

        if (appointmentId) {
            fetchChatHistory();
        }
    }, [appointmentId]);

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-zinc-800">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-600" />
                    Chat History
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Read-only view of your booking conversation
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[600px] px-6 py-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
                            <p>Loading chat history...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500 dark:text-red-400">
                            <p>{error}</p>
                        </div>
                    ) : !chatMessages || chatMessages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p>No chat history available for this appointment.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {chatMessages.map((message) => (
                                <div key={message.id} className="space-y-3">
                                    {/* User Message */}
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] bg-teal-600 text-white rounded-lg px-4 py-2">
                                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                            <p className="text-xs mt-1 opacity-70">
                                                {new Date(message.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {/* AI Response */}
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg px-4 py-2">
                                            <p className="text-sm whitespace-pre-wrap">{message.ai_response}</p>
                                            <p className="text-xs mt-1 opacity-70">
                                                {new Date(message.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}


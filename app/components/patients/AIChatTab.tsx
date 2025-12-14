'use client';

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatTabProps {
    appointment: any;
    userType?: 'patient' | 'doctor';
}

export function AIChatTab({ appointment, userType = 'patient' }: AIChatTabProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const consultation = appointment?.consultation && Array.isArray(appointment.consultation)
        ? appointment.consultation[0]
        : appointment?.consultation;

    const consultationId = consultation?.id as string | undefined;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load existing chat messages
    useEffect(() => {
        if (!isInitialized && consultationId) {
            loadChatHistory();
            setIsInitialized(true);
        }
    }, [consultationId, isInitialized]);

    const loadChatHistory = async () => {
        try {
            const response = await fetch(`/api/chat/rag/history?consultationId=${consultationId || ''}`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    const filtered = data.messages.filter((msg: any) => msg.user_type === userType);
                    const hydrated: Message[] = filtered.flatMap((msg: any) => {
                        const createdAt = new Date(msg.created_at);
                        const userMsg: Message = {
                            id: `${msg.id}-user`,
                            role: 'user',
                            content: msg.message,
                            timestamp: createdAt,
                        };
                        const assistantMsg: Message = {
                            id: `${msg.id}-assistant`,
                            role: 'assistant',
                            content: msg.ai_response,
                            // ensure stable ordering after the user message
                            timestamp: new Date(createdAt.getTime() + 1),
                        };
                        return [userMsg, assistantMsg].filter(m => !!m.content);
                    });
                    setMessages(hydrated);
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat/rag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: currentInput,
                    appointmentId: appointment.id,
                    consultationId: consultationId || null,
                    userType,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const data = await response.json();
            
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || 'I apologize, but I encountered an error. Please try again.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'I apologize, but I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <CardHeader className="border-b border-gray-100 dark:border-zinc-800">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-teal-600" />
                    AI Chat Assistant
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Ask questions about your appointment, consultation, or medical records
                </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 px-6 py-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Start a conversation with the AI assistant.</p>
                            <p className="text-sm mt-2">
                                I can help answer questions about your appointment, consultation summary, and doctor's report.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                            message.role === 'user'
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <p className="text-xs mt-1 opacity-70">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg px-4 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </ScrollArea>
                <div className="px-6 pb-6 pt-4 border-t">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask a question about your appointment..."
                            disabled={isLoading || !consultation}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim() || !consultation}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                    {!consultation && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            AI Chat will be available after your consultation is completed.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


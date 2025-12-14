'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageSquarePlus } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';

/**
 * Renders the booking appointment chat page and manages chat session state, messages, and transport.
 *
 * Initializes a per-session `chatId`, creates a transport that includes the `chatId` in requests, seeds an initial assistant greeting when the conversation is empty, auto-scrolls the message list on updates, and provides a controlled input form to send messages via the chat SDK.
 *
 * @returns The React element for the booking appointment chat page.
 */
export default function BookAppointmentPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  
  // Initialize chat_id on mount (generate new UUID for new chat session)
  useEffect(() => {
    if (!chatId) {
      // Generate a new UUID for this chat session
      const newChatId = crypto.randomUUID();
      setChatId(newChatId);
    }
  }, [chatId]);
  
  // Recreate transport when chatId changes to ensure it's included in requests
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat/booking',
      body: {
        chatId: chatId || undefined,
      },
    });
  }, [chatId]);
  
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });

  // Set initial message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: "Hello! I'm here to help you book an appointment. What would you like to know?" }],
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    // Generate a new chat_id for a new chat session
    const newChatId = crypto.randomUUID();
    setChatId(newChatId);
    // Clear messages to start fresh
    setMessages([
      {
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: "Hello! I'm here to help you book an appointment. What would you like to know?" }],
      },
    ]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AuthNavbar />
      <main className="flex-1 flex flex-col overflow-hidden">
      
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  What can I help with?
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Start a conversation to book your appointment
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-teal-600 text-white'
                          : 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800'
                      }`}
                    >
                      {message.parts.map((part, index) => {
                        if (part.type === 'text') {
                          return (
                            <div
                              key={`${message.id}-${index}`}
                              className="text-sm leading-relaxed whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: part.text
                                  ?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/✔/g, '<span class="text-green-500">✔</span>')
                                  .replace(/\n/g, '<br />') || ''
                              }}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {error.message || 'An error occurred. Please try again.'}
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim() && !isLoading) {
                  sendMessage({ text: input });
                  setInput('');
                }
              }}
              className="flex items-end gap-2"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything"
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 rounded-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !isLoading) {
                        sendMessage({ text: input });
                        setInput('');
                      }
                    }
                  }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
                    title="Voice input (coming soon)"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 rounded-full bg-teal-600 hover:bg-teal-700 text-white p-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

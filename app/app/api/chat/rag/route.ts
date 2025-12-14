import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, appointmentId, consultationId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    // Get patient profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    // Build RAG context from multiple sources
    let contextParts: string[] = [];

    // 1. Get booking chat messages
    const { data: bookingChat } = await supabase
      .from('booking_chat')
      .select('role, message, ai_response')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: true });

    if (bookingChat && bookingChat.length > 0) {
      const bookingContext = bookingChat
        .map((msg: any) => {
          // Preferred: per-message rows using `role`
          if (msg.role) {
            if (msg.role === 'user') return `Patient: ${msg.message}`;
            if (msg.role === 'assistant') return `Assistant: ${msg.ai_response}`;
            // Unknown role - best effort
            return `Message: ${msg.message || msg.ai_response || ''}`;
          }
          // Legacy: one exchange per row
          return `Patient: ${msg.message}\nAssistant: ${msg.ai_response}`;
        })
        .join('\n');
      contextParts.push(`Booking Conversation:\n${bookingContext}`);
    } else {
      contextParts.push('Booking Conversation: Not available (pending)');
    }

    // 2. Get consultation summary
    if (consultationId) {
      const { data: consultation } = await supabase
        .from('consultations')
        .select('ai_summary, doctor_notes, processing_status')
        .eq('id', consultationId)
        .single();

      if (consultation) {
        if (consultation.ai_summary) {
          contextParts.push(`Consultation Summary:\n${consultation.ai_summary}`);
        } else {
          contextParts.push('Consultation Summary: Pending (not yet available)');
        }

        if (consultation.doctor_notes) {
          contextParts.push(`Doctor's Report:\n${consultation.doctor_notes}`);
        } else {
          contextParts.push("Doctor's Report: Pending (not yet available)");
        }
      } else {
        contextParts.push('Consultation Summary: Pending (not yet available)');
        contextParts.push("Doctor's Report: Pending (not yet available)");
      }
    } else {
      contextParts.push('Consultation Summary: Pending (consultation not started yet)');
      contextParts.push("Doctor's Report: Pending (consultation not started yet)");
    }

    // 3. Get existing chat history for context
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    if (consultationId) {
      const { data: chatHistory } = await supabase
        .from('chat_messages')
        .select('message, ai_response, user_type')
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (chatHistory) {
        conversationHistory = chatHistory.flatMap(msg => [
          { role: 'user' as const, content: msg.message },
          { role: 'assistant' as const, content: msg.ai_response },
        ]);
      }
    }

    // Build system prompt with RAG context
    const systemPrompt = `You are a helpful AI medical assistant helping a patient understand their medical appointment and consultation.

Patient Name: ${profile?.first_name || 'Patient'} ${profile?.last_name || ''}

CONTEXT FROM PATIENT'S RECORDS:
${contextParts.join('\n\n---\n\n')}

IMPORTANT INSTRUCTIONS:
- If any information is marked as "Pending" or "not yet available", clearly state that to the patient
- Use the provided context to answer questions accurately
- Be empathetic, professional, and clear
- If you don't have information in the context, say so rather than making assumptions
- Help patients understand their medical information in simple terms
- Do not provide medical diagnoses or treatment advice beyond what's in the records

Answer the patient's questions based on the context provided above.`;

    // Generate AI response
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message },
      ],
    });

    const response = result.text;

    // Save the conversation to database (only if consultation exists)
    if (consultationId) {
      const { error: dbError } = await supabase
        .from('chat_messages')
        .insert({
          consultation_id: consultationId,
          user_id: user.id,
          user_type: 'patient',
          message: message,
          ai_response: response,
        });

      if (dbError) {
        console.error('Error saving chat message:', dbError);
        // Continue even if DB save fails
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in RAG chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


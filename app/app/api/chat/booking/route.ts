import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs, customProvider } from 'ai';
import { z } from 'zod';
import moment from 'moment-timezone';

/**
 * Parse date/time string as IST time, handling relative dates like "tomorrow"
 * This ensures times are treated as IST times (not converted from UTC)
 */
function parseDateTimeAsIST(dateStr: string, timeStr: string): moment.Moment | null {
  const combined = `${dateStr.trim()} ${timeStr.trim()}`;
  
  // Get current time in IST for relative date calculations
  const nowIST = moment.tz('Asia/Kolkata');
  
  // Handle relative dates first
  let processedDate = dateStr.trim().toLowerCase();
  if (processedDate === 'tomorrow') {
    processedDate = moment.tz('Asia/Kolkata').add(1, 'day').format('YYYY-MM-DD');
  } else if (processedDate === 'after tomorrow' || processedDate === 'day after tomorrow') {
    processedDate = moment.tz('Asia/Kolkata').add(2, 'days').format('YYYY-MM-DD');
  } else if (processedDate === 'today') {
    processedDate = moment.tz('Asia/Kolkata').format('YYYY-MM-DD');
  }
  
  // Rebuild combined string with processed date
  const processedCombined = `${processedDate} ${timeStr.trim()}`;
  
  // Multiple format patterns to handle various date/time formats
  // Times are parsed as IST times (not converted)
  const formats = [
    'YYYY-MM-DD h:mm A',           // "2025-12-15 3:00 PM"
    'YYYY-MM-DD hh:mm A',          // "2025-12-15 03:00 PM"
    'YYYY-MM-DD HH:mm',            // "2025-12-15 15:00"
    'DD MMMM YYYY h:mm A',         // "15 december 2025 3:00 PM"
    'DD MMMM YYYY hh:mm A',        // "15 december 2025 03:00 PM"
    'DD MMMM YYYY HH:mm',          // "15 december 2025 15:00"
    'MMMM Do YYYY h:mm A',         // "december 15th 2025 3:00 PM"
    'MMMM Do YYYY hh:mm A',        // "december 15th 2025 03:00 PM"
    'MMMM Do YYYY HH:mm',          // "december 15th 2025 15:00"
    'DD/MM/YYYY h:mm A',           // "15/12/2025 3:00 PM"
    'DD/MM/YYYY hh:mm A',          // "15/12/2025 03:00 PM"
    'DD/MM/YYYY HH:mm',            // "15/12/2025 15:00"
    'MM/DD/YYYY h:mm A',           // "12/15/2025 3:00 PM"
    'MM/DD/YYYY hh:mm A',          // "12/15/2025 03:00 PM"
    'MM/DD/YYYY HH:mm',         // "12/15/2025 15:00"
    'YYYY-MM-DD h A',              // "2025-12-15 3 PM"
    'DD MMMM YYYY h A',            // "15 december 2025 3 PM"
    'MMMM Do YYYY h A',            // "december 15th 2025 3 PM"
  ];
  
  // Parse with format array - this ensures times are treated as IST times (not converted)
  let parsed = moment.tz(processedCombined, formats, 'Asia/Kolkata');
  
  // If parsing with formats failed, try moment's natural language parsing
  // but we need to manually set the time to avoid timezone conversion issues
  if (!parsed.isValid()) {
    // First, try to parse just the date part in IST
    const dateParsed = moment.tz(processedDate, ['YYYY-MM-DD', 'DD MMMM YYYY', 'MMMM Do YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY'], 'Asia/Kolkata');
    
    if (dateParsed.isValid()) {
      // Parse time component manually to avoid timezone conversion
      const timeMatch = timeStr.trim().match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3]?.toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        // Set the time explicitly in IST (no conversion)
        parsed = dateParsed.hour(hours).minute(minutes).second(0).millisecond(0).tz('Asia/Kolkata', true);
      } else {
        // If time parsing fails, try natural language on the full string
        parsed = moment.tz(processedCombined, 'Asia/Kolkata');
      }
    } else {
      // If date parsing fails, try natural language on the full string
      parsed = moment.tz(processedCombined, 'Asia/Kolkata');
      
      // If still invalid, try original combined string
      if (!parsed.isValid()) {
        parsed = moment.tz(combined, 'Asia/Kolkata');
      }
    }
  }
  
  return parsed.isValid() ? parsed : null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, chatId }: { messages: UIMessage[]; chatId?: string } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages are required', { status: 400 });
    }

    // Get the last user message for saving to database
    const lastMessage = messages[messages.length - 1];
    const textPart = lastMessage?.parts?.find((p: any) => p.type === 'text');
    const userMessage = (textPart && 'text' in textPart ? textPart.text : '') || '';

    // Generate chat_id if not provided (new chat session)
    let currentChatId = chatId;
    if (!currentChatId) {
      // Generate a new UUID for this chat session
      const { randomUUID } = await import('crypto');
      currentChatId = randomUUID();
    }
    
    // Debug: verify whether chatId is stable or regenerating
    console.log('🧵 Booking chat session:', {
      incomingChatId: chatId || null,
      resolvedChatId: currentChatId,
      userId: user.id,
      messagesCount: messages.length,
    });

    // Get patient profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    /**
     * Store one row per message, grouped by `chat_id` (session).
     *
     * NOTE: `ai_response` is NOT NULL in the current DB schema, so for user rows
     * we store `ai_response: ''` (placeholder), and for assistant rows we store
     * `message: ''` (placeholder). The `role` column indicates which field
     * contains the real content.
     */
    try {
      const { error: insertError } = await supabase
        .from('booking_chat')
        .insert({
          patient_id: user.id,
          chat_id: currentChatId,
          role: 'user',
          message: userMessage,
          ai_response: '', // NOT NULL column - placeholder for user rows
        })
        .select('id');

      if (insertError) {
        console.error('Error inserting booking_chat user message row:', insertError);
      } else {
        console.log('✅ booking_chat user message saved');
      }
    } catch (dbError) {
      console.error('Error saving booking_chat user message row:', dbError);
      // Continue even if DB save fails
    }

    // Convert UI messages to model messages format
    const modelMessages = convertToModelMessages(messages);

    // Get available doctors for appointment booking
    const { data: doctors, error: doctorsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, specialization')
      .eq('role', 'doctor')
      .limit(5);
    
    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError);
    }

    const doctorsList = doctors?.map(d => 
      `- Dr. ${d.first_name} ${d.last_name} | Specialization: ${d.specialization || 'General Practitioner'}`
    ).join('\n') || 'No doctors available';

    // Create AI prompt with context - simplified and more conversational
    const systemPrompt = `You are a friendly and helpful AI assistant helping ${profile?.first_name || 'the patient'} book a medical appointment.

Available doctors:
${doctorsList}

🚨 CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:

🩺 INITIAL CONVERSATION (MANDATORY)
- Start by asking:
  1. How the patient is feeling
  2. What symptoms or problem they are experiencing
- Keep questions short, empathetic, and patient-friendly.
- Do NOT diagnose. Only collect information.

1. **YOU MUST USE TOOLS TO BOOK APPOINTMENTS** - When the patient provides:
   - Doctor name (e.g., "Dr. Shekhar Maurya" or "Shekhar Maurya")
   - Date (e.g., "15 december 2025", "tomorrow", "2025-12-15")
   - Time (e.g., "12 pm", "12:00", "14:00")
   
   YOU MUST IMMEDIATELY call the bookAppointment tool. DO NOT just generate text saying you're booking.

2. **NEVER SAY YOU'RE BOOKING WITHOUT CALLING THE TOOL** - Phrases like:
   - "I'll book that for you"
   - "Let me book your appointment"
   - "Your appointment has been booked"
   
   Are FORBIDDEN unless you have ALREADY called bookAppointment and received success=true.

3. **ALWAYS READ TOOL RESULTS** - After calling bookAppointment:
   - If result.success === true: Tell the patient their appointment is confirmed with the exact details from result.message
   - If result.success === false: Explain the error from result.error and help resolve it

4. **WORKFLOW**:
   - Step 1: Collect doctor name, date, and time through conversation
   - Step 2: When you have all three, IMMEDIATELY call bookAppointment tool (don't ask for confirmation)
   - Step 3: Read the tool result and communicate the actual outcome to the patient

5. **DATE/TIME FORMATS** - Accept ANY format:
   - "15 december 2025, 12 pm"
   - "tomorrow at 2pm"
   - "2025-12-15 at 14:00"
   - "next Monday 3:00 PM"
   The system handles all parsing automatically.

REMEMBER: Text responses do NOT create appointments. Only calling bookAppointment tool creates appointments.`;

    // Tool to check doctor availability
    const checkAvailabilityTool = tool({
      description: 'Check if a doctor is available at a specific date and time. Use this to verify availability before booking. Accepts dates and times in any format.',
      inputSchema: z.object({
        doctorName: z.string().describe('The full name of the doctor (e.g., "John Smith", "Dr. John Smith", or just "John")'),
        appointmentDate: z.string().describe('The appointment date in any format (e.g., "2024-12-25", "tomorrow", "12/25/2024")'),
        appointmentTime: z.string().describe('The appointment time in any format (e.g., "2pm", "14:30", "2:00 PM")'),
      }),
      execute: async ({ doctorName, appointmentDate, appointmentTime }) => {
        try {
          // Parse date/time as IST time (handles relative dates like "tomorrow")
          const appointmentMoment = parseDateTimeAsIST(appointmentDate, appointmentTime);
          
          if (!appointmentMoment || !appointmentMoment.isValid()) {
            return {
              available: false,
              reason: 'Invalid date or time format. Please provide a valid date and time.',
            };
          }

          // Format as ISO string with timezone for database
          const appointmentDateTimeISO = appointmentMoment.format();

          // Find doctor by name (flexible matching)
          const cleanDoctorName = doctorName
            .replace(/^Dr\.?\s*/i, '')
            .trim()
            .toLowerCase();
          
          const { data: allDoctors, error: doctorsFetchError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role')
            .eq('role', 'doctor');

          if (doctorsFetchError) {
            console.error('Error fetching doctors:', doctorsFetchError);
            return {
              available: false,
              reason: 'Unable to fetch doctor information. Please try again.',
            };
          }

          const doctor = allDoctors?.find(d => {
            const fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim().toLowerCase();
            const firstName = (d.first_name || '').toLowerCase();
            const lastName = (d.last_name || '').toLowerCase();
            const nameParts = cleanDoctorName.split(/\s+/);
            
            // Exact match
            if (fullName === cleanDoctorName) return true;
            // Contains match
            if (fullName.includes(cleanDoctorName) || cleanDoctorName.includes(fullName)) return true;
            // First and last name match
            if (cleanDoctorName.includes(firstName) && cleanDoctorName.includes(lastName)) return true;
            // Partial match - if user provides just first or last name
            if (nameParts.length === 1 && (firstName === nameParts[0] || lastName === nameParts[0])) return true;
            // Match if all parts of the name are found
            if (nameParts.every(part => fullName.includes(part))) return true;
            
            return false;
          });

          if (!doctor) {
            const availableDoctors = allDoctors?.map(d => `Dr. ${d.first_name} ${d.last_name}`).join(', ') || 'none';
            return {
              available: false,
              reason: `Doctor "${doctorName}" not found. Available doctors: ${availableDoctors}.`,
            };
          }

          // Check availability using the database function
          const { data: availabilityCheck, error: availabilityError } = await supabase
            .rpc('check_doctor_availability', {
              p_doctor_id: doctor.id,
              p_appointment_date: appointmentDateTimeISO,
              p_appointment_duration_minutes: 30,
            });

          if (availabilityError) {
            console.error('Error checking availability:', availabilityError);
            return {
              available: false,
              reason: 'Unable to check availability. Please try again.',
            };
          }

          return {
            available: availabilityCheck?.available || false,
            reason: availabilityCheck?.reason || 'Availability check completed',
            suggestedAction: availabilityCheck?.available 
              ? 'This time slot is available. You can proceed with booking.'
              : 'Please suggest an alternative time slot to the patient.',
          };
        } catch (error) {
          console.error('Error in checkAvailability tool:', error);
          return {
            available: false,
            reason: 'An error occurred while checking availability.',
          };
        }
      },
    });

    // Tool to book appointment
    const bookAppointmentTool = tool({
      description: 'REQUIRED: Use this tool to actually book an appointment. This is the ONLY way to create an appointment - you MUST call this tool when the patient provides doctor name, date, and time. Do NOT just say you are booking - you must call this tool. The tool will automatically check availability before booking. Accepts dates and times in any format.',
      inputSchema: z.object({
        doctorName: z.string().describe('The full name of the doctor (e.g., "John Smith", "Dr. John Smith", or just "John")'),
        appointmentDate: z.string().describe('The appointment date in any format (e.g., "2024-12-25", "tomorrow", "12/25/2024", "15 december 2025")'),
        appointmentTime: z.string().describe('The appointment time in any format (e.g., "2pm", "14:30", "2:00 PM", "12 pm")'),
        notes: z.string().optional().describe('Any additional notes or reason for the appointment'),
      }),
      execute: async ({ doctorName, appointmentDate, appointmentTime, notes }) => {
        console.log('🔧 bookAppointment tool called with:', { doctorName, appointmentDate, appointmentTime, notes });
        try {
          // Parse date/time as IST time (handles relative dates like "tomorrow")
          const appointmentMoment = parseDateTimeAsIST(appointmentDate, appointmentTime);
          
          if (!appointmentMoment || !appointmentMoment.isValid()) {
            console.log('❌ Invalid date format');
            return {
              success: false,
              error: 'Invalid date or time format. Please provide a valid date and time.',
            };
          }
          
          // Format as ISO string with timezone for database
          const appointmentDateTimeISO = appointmentMoment.format();
          
          console.log('✅ Date created with moment (IST):', {
            local: appointmentMoment.format('YYYY-MM-DD HH:mm:ss'),
            iso: appointmentDateTimeISO,
            timezone: appointmentMoment.format('Z'),
            input: `${appointmentDate} ${appointmentTime}`,
          });
          
          // Find doctor by name (flexible matching)
          const cleanDoctorName = doctorName
            .replace(/^Dr\.?\s*/i, '')
            .trim()
            .toLowerCase();
          console.log('🔍 Looking for doctor:', cleanDoctorName);
          
          const { data: allDoctors, error: doctorsFetchError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role')
            .eq('role', 'doctor');

          if (doctorsFetchError) {
            console.error('❌ Error fetching doctors:', doctorsFetchError);
            return {
              success: false,
              error: 'Unable to fetch doctor information. Please try again.',
            };
          }

          console.log('👨‍⚕️ Found doctors:', allDoctors?.map(d => `${d.first_name} ${d.last_name}`));

          const doctor = allDoctors?.find(d => {
            const fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim().toLowerCase();
            const firstName = (d.first_name || '').toLowerCase();
            const lastName = (d.last_name || '').toLowerCase();
            const nameParts = cleanDoctorName.split(/\s+/);
            
            // Exact match
            if (fullName === cleanDoctorName) return true;
            // Contains match
            if (fullName.includes(cleanDoctorName) || cleanDoctorName.includes(fullName)) return true;
            // First and last name match
            if (cleanDoctorName.includes(firstName) && cleanDoctorName.includes(lastName)) return true;
            // Partial match - if user provides just first or last name
            if (nameParts.length === 1 && (firstName === nameParts[0] || lastName === nameParts[0])) return true;
            // Match if all parts of the name are found
            if (nameParts.every(part => fullName.includes(part))) return true;
            
            return false;
          });

          if (!doctor) {
            const availableDoctors = allDoctors?.map(d => `Dr. ${d.first_name} ${d.last_name}`).join(', ') || 'none';
            console.log('❌ Doctor not found. Available:', availableDoctors);
            return {
              success: false,
              error: `Doctor "${doctorName}" not found. Available doctors: ${availableDoctors}. Please try again with one of these names.`,
            };
          }

          console.log('✅ Doctor found:', { id: doctor.id, name: `${doctor.first_name} ${doctor.last_name}` });
          const doctorId = doctor.id;

          // Check doctor availability
          console.log('🔍 Checking availability for:', {
            doctorId,
            appointmentDate: appointmentDateTimeISO
          });
          const { data: availabilityCheck, error: availabilityError } = await supabase
            .rpc('check_doctor_availability', {
              p_doctor_id: doctorId,
              p_appointment_date: appointmentDateTimeISO,
              p_appointment_duration_minutes: 30, // Default 30-minute appointments
            });

          if (availabilityError) {
            console.error('❌ Error checking doctor availability:', availabilityError);
            return {
              success: false,
              error: 'Unable to verify doctor availability. Please try again.',
            };
          }

          console.log('📊 Availability check result:', availabilityCheck);

          // Check if doctor is available
          if (!availabilityCheck?.available) {
            console.log('❌ Doctor not available:', availabilityCheck?.reason);
            return {
              success: false,
              error: availabilityCheck?.reason || 'Doctor is not available at this time. Please choose a different time slot.',
            };
          }

          console.log('✅ Doctor is available, creating appointment...');

          // Create appointment
          console.log('💾 Creating appointment with data:', {
            patient_id: user.id,
            doctor_id: doctorId,
            appointment_date: appointmentDateTimeISO,
            status: 'scheduled',
            notes: notes || null,
          });
          const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .insert({
              patient_id: user.id,
              doctor_id: doctorId,
              appointment_date: appointmentDateTimeISO,
              status: 'scheduled',
              notes: notes || null,
              booking_chat_id: currentChatId,
            })
            .select()
            .single();

          if (appointmentError) {
            console.error('❌ Error creating appointment:', appointmentError);
            // Provide more specific error message
            const errorMsg = appointmentError.message || 'Failed to create appointment';
            return {
              success: false,
              error: `Unable to create appointment: ${errorMsg}. Please try again or contact support.`,
            };
          }

          if (!appointment) {
            console.log('❌ Appointment creation returned no data');
            return {
              success: false,
              error: 'Appointment creation failed. Please try again.',
            };
          }

          console.log('✅ Appointment created successfully:', appointment.id);

          // Link booking chat messages to the appointment (non-blocking)
          try {
            const { data: linkedRows, error: linkError } = await supabase
              .from('booking_chat')
              .update({ appointment_id: appointment.id })
              .eq('patient_id', user.id)
              .eq('chat_id', currentChatId)
              .select('id');
            
            if (linkError) {
              console.error('Error linking chat to appointment (update failed):', linkError);
            } else {
              console.log('✅ Linked booking_chat rows to appointment:', {
                chatId: currentChatId,
                appointmentId: appointment.id,
                updatedRows: linkedRows?.length || 0,
              });
            }
          } catch (linkError) {
            console.error('Error linking chat to appointment:', linkError);
            // Don't fail the booking if linking fails
          }

          // Format date and time for display using moment
          const formattedDate = appointmentMoment.format('dddd, MMMM Do, YYYY');
          const formattedTime = appointmentMoment.format('h:mm A');

          const result = {
            success: true,
            appointmentId: appointment.id,
            message: `✅ Appointment successfully booked! You have an appointment with Dr. ${doctor.first_name} ${doctor.last_name} on ${formattedDate} at ${formattedTime}. Your appointment ID is ${appointment.id}.`,
          };
          console.log('✅ bookAppointment tool SUCCESS:', result);
          return result;
        } catch (error) {
          console.error('❌ Error in bookAppointment tool:', error);
          const errorResult = {
            success: false,
            error: 'An error occurred while booking the appointment. Please try again.',
          };
          console.log('❌ bookAppointment tool ERROR result:', errorResult);
          return errorResult;
        }
      },
    });

    // Helper function to create stream with onFinish callback
    const createStreamWithCallback = (model: any) => {
      return streamText({
        model,
        system: systemPrompt,
        messages: modelMessages,
        tools: {
          checkAvailability: checkAvailabilityTool,
          bookAppointment: bookAppointmentTool,
        },
        stopWhen: stepCountIs(10), // Allow up to 10 steps for tool calls
        maxRetries: 0, // Disable retries so we can catch errors immediately and fallback
        onStepFinish: async ({ text, toolCalls, toolResults }) => {
          console.log(`📊 Step finished:`, {
            hasText: !!text,
            toolCallsCount: toolCalls?.length || 0,
            toolResultsCount: toolResults?.length || 0,
          });
          
          if (toolCalls && toolCalls.length > 0) {
            console.log('🔧 Tool calls in this step:', toolCalls.map(tc => ({
              toolName: tc.toolName,
              toolCallId: tc.toolCallId,
            })));
          }
          
          if (toolResults && toolResults.length > 0) {
            console.log('✅ Tool results in this step:', toolResults.map(tr => ({
              toolName: tr.toolName,
              toolCallId: tr.toolCallId,
              output: (tr as any).output || (tr as any).result,
            })));
          }
        },
        onFinish: async ({ text, toolResults, steps }) => {
          // Save assistant message to database after streaming completes
          // Skip if already saved (prevents duplicates during fallback)
          if (assistantMessageSaved) {
            console.log('⏭️ Groq: Assistant message already saved, skipping');
            return;
          }
          
          try {
            console.log('🏁 Groq final onFinish called:', {
              textLength: text?.length || 0,
              toolResultsCount: toolResults?.length || 0,
              stepsCount: steps?.length || 0,
            });

            // Log tool results for debugging
            if (toolResults && toolResults.length > 0) {
              console.log('✅ Groq final tool results:', JSON.stringify(toolResults, null, 2));
            } else {
              console.log('⚠️ Groq: No tool results in onFinish');
            }

            // Extract tool results from steps (they're often only in steps, not in toolResults)
            let allToolResults: any[] = toolResults || [];
            if (steps && steps.length > 0) {
              const stepToolResults = steps.flatMap(step => {
                // Tool results can be in step.toolResults or step.content (as tool-result parts)
                const results = (step.toolResults || []) as any[];
                const contentResults = (step.content || [])
                  .filter((part: any) => part.type === 'tool-result')
                  .map((part: any) => ({
                    toolName: part.toolName,
                    toolCallId: part.toolCallId,
                    output: part.output,
                  }));
                return [...results, ...contentResults];
              });
              
              console.log('📋 Groq tool results from steps:', stepToolResults.length);
              if (stepToolResults.length > 0) {
                console.log('✅ Groq all tool results from steps:', JSON.stringify(stepToolResults, null, 2));
                // Merge step results with onFinish results (prefer step results as they're more complete)
                allToolResults = stepToolResults.length > 0 ? stepToolResults : allToolResults;
              }
            }

            // Check if appointment was created via tool call
            const appointmentResult = allToolResults.find(
              (result: any) => result.toolName === 'bookAppointment'
            ) as any;
            
            // Tool results use 'output' property, but some versions might use 'result'
            const toolOutput = appointmentResult?.output || appointmentResult?.result;
            const appointmentId = toolOutput?.appointmentId || null;
            
            if (appointmentResult) {
              console.log('✅ Groq appointment booking result found:', toolOutput);
            } else {
              console.log('❌ Groq: No appointment result found in toolResults or steps');
            }

            // Insert assistant message as its own row
            const { error: assistantInsertError } = await supabase
              .from('booking_chat')
              .insert({
                patient_id: user.id,
                chat_id: currentChatId,
                role: 'assistant',
                message: '', // placeholder for assistant rows (NOT NULL column)
                ai_response: text,
                appointment_id: appointmentId,
              });

            if (assistantInsertError) {
              console.error('Groq: Error inserting booking_chat assistant row:', assistantInsertError);
            }
            
            // Mark as saved to prevent duplicate inserts
            assistantMessageSaved = true;
            console.log('✅ Groq: Assistant message saved to database');
          } catch (dbError) {
            console.error('Groq: Error saving assistant message:', dbError);
            // Continue even if DB save fails
          }
        },
      });
    };

    // Track if Google failed so we can fallback to Groq
    let googleFailed = false;
    // Track if assistant message has been saved to prevent duplicates during fallback
    let assistantMessageSaved = false;

    // Try Google first with error handler
    const googleResult = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        checkAvailability: checkAvailabilityTool,
        bookAppointment: bookAppointmentTool,
      },
      stopWhen: stepCountIs(10),
      maxRetries: 0,
      onError: ({ error }) => {
        console.error('Google model error detected, will fallback to Groq:', error);
        googleFailed = true;
      },
      onStepFinish: async ({ text, toolCalls, toolResults }) => {
        console.log(`📊 Google Step finished:`, {
          hasText: !!text,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
        });
        
        if (toolCalls && toolCalls.length > 0) {
          console.log('🔧 Google tool calls in this step:', toolCalls.map(tc => ({
            toolName: tc.toolName,
            toolCallId: tc.toolCallId,
          })));
        }
        
        if (toolResults && toolResults.length > 0) {
          console.log('✅ Google tool results in this step:', toolResults.map(tr => ({
            toolName: tr.toolName,
            toolCallId: tr.toolCallId,
            output: (tr as any).output || (tr as any).result,
          })));
        }
      },
      onFinish: async ({ text, toolResults, steps }) => {
        // Save assistant message to database after streaming completes
        // Skip if already saved (prevents duplicates during fallback)
        if (assistantMessageSaved) {
          console.log('⏭️ Google: Assistant message already saved, skipping');
          return;
        }
        
        try {
          console.log('🏁 Google final onFinish called:', {
            textLength: text?.length || 0,
            toolResultsCount: toolResults?.length || 0,
            stepsCount: steps?.length || 0,
          });

          // Log tool results for debugging
          if (toolResults && toolResults.length > 0) {
            console.log('✅ Google final tool results:', JSON.stringify(toolResults, null, 2));
          } else {
            console.log('⚠️ Google: No tool results in onFinish');
          }

          // Extract tool results from steps (they're often only in steps, not in toolResults)
          let allToolResults: any[] = toolResults || [];
          if (steps && steps.length > 0) {
            const stepToolResults = steps.flatMap(step => {
              // Tool results can be in step.toolResults or step.content (as tool-result parts)
              const results = (step.toolResults || []) as any[];
              const contentResults = (step.content || [])
                .filter((part: any) => part.type === 'tool-result')
                .map((part: any) => ({
                  toolName: part.toolName,
                  toolCallId: part.toolCallId,
                  output: part.output,
                }));
              return [...results, ...contentResults];
            });
            
            console.log('📋 Google tool results from steps:', stepToolResults.length);
            if (stepToolResults.length > 0) {
              console.log('✅ Google all tool results from steps:', JSON.stringify(stepToolResults, null, 2));
              // Merge step results with onFinish results (prefer step results as they're more complete)
              allToolResults = stepToolResults.length > 0 ? stepToolResults : allToolResults;
            }
          }

          const appointmentResult = allToolResults.find(
            (result: any) => result.toolName === 'bookAppointment'
          ) as any;
          
          // Tool results use 'output' property, but some versions might use 'result'
          const toolOutput = appointmentResult?.output || appointmentResult?.result;
          const appointmentId = toolOutput?.appointmentId || null;
          
          if (appointmentResult) {
            console.log('✅ Google appointment booking result found:', toolOutput);
          } else {
            console.log('❌ Google: No appointment result found in toolResults or steps');
          }

          // Insert assistant message as its own row
          const { error: assistantInsertError } = await supabase
            .from('booking_chat')
            .insert({
              patient_id: user.id,
              chat_id: currentChatId,
              role: 'assistant',
              message: '', // placeholder for assistant rows (NOT NULL column)
              ai_response: text,
              appointment_id: appointmentId,
            });

          if (assistantInsertError) {
            console.error('Google: Error inserting booking_chat assistant row:', assistantInsertError);
          }
          
          // Mark as saved to prevent duplicate inserts during fallback
          assistantMessageSaved = true;
          console.log('✅ Google: Assistant message saved to database');
        } catch (dbError) {
          console.error('Google: Error saving assistant message:', dbError);
        }
      },
    });

    // Get the response
    const googleResponse = googleResult.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('Google response error in toUIMessageStreamResponse:', error);
        googleFailed = true;
        return 'An error occurred. Switching to backup provider...';
      },
    });

    // If Google already failed (detected in onError), immediately use Groq
    if (googleFailed || !googleResponse.body) {
      console.log('Google failed early, immediately switching to Groq');
      const groqResult = createStreamWithCallback(groq('llama-3.3-70b-versatile'));
      const groqResponse = groqResult.toUIMessageStreamResponse();
      const headers = new Headers(groqResponse.headers);
      headers.set('x-chat-id', currentChatId);
      return new Response(groqResponse.body, {
        headers,
        status: groqResponse.status,
        statusText: groqResponse.statusText,
      });
    }

    const reader = googleResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let hasStarted = false;

    const wrappedStream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        let isCancelled = false;

        const safeClose = () => {
          if (isClosed) return;
          try {
            controller.close();
          } catch {
            // ignore double-close
          } finally {
            isClosed = true;
          }
        };

        const safeEnqueue = (value: any) => {
          if (isClosed || isCancelled) return false;
          try {
            controller.enqueue(value);
            return true;
          } catch (e: any) {
            // Most common case: ERR_INVALID_STATE when controller is already closed.
            isClosed = true;
            return false;
          }
        };

        const safeError = (err: any) => {
          if (isClosed || isCancelled) return;
          try {
            controller.error(err);
          } catch {
            // ignore if already closed
          } finally {
            isClosed = true;
          }
        };

        let shouldFallback = false;
        
        try {
          // Try to read from Google stream
          while (true) {
            if (isCancelled || isClosed) return;
            const { done, value } = await reader.read();
            
            if (done) {
              if (!hasStarted) {
                // Stream ended before any data - likely an error
                shouldFallback = true;
                break;
              }
              safeClose();
              return;
            }
            
            hasStarted = true;
            
            // Decode and check for error patterns
            try {
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // Check for common error indicators
              if (buffer.includes('"error"') || 
                  buffer.includes('quota') || 
                  buffer.includes('exceeded') || 
                  buffer.includes('429') ||
                  buffer.includes('RESOURCE_EXHAUSTED') ||
                  buffer.includes('AI_APICallError')) {
                console.error('Error detected in Google stream, falling back to Groq');
                shouldFallback = true;
                reader.cancel().catch(() => {});
                break;
              }
            } catch (decodeError) {
              // If decoding fails, continue - might be binary data
            }
            
            safeEnqueue(value);
          }
        } catch (error) {
          console.error('Error reading Google stream, falling back to Groq:', error);
          shouldFallback = true;
          reader.cancel().catch(() => {});
        }
        
        // Fallback to Groq if needed
        if (shouldFallback || googleFailed) {
          try {
            if (isCancelled || isClosed) return;
            console.log('Switching to Groq fallback provider...');
            const groqResult = createStreamWithCallback(groq('llama-3.3-70b-versatile'));
            const groqResponse = groqResult.toUIMessageStreamResponse();
            
            if (groqResponse.body) {
              const groqReader = groqResponse.body.getReader();
              while (true) {
                if (isCancelled || isClosed) {
                  groqReader.cancel().catch(() => {});
                  return;
                }
                const { done, value } = await groqReader.read();
                if (done) {
                  safeClose();
                  break;
                }
                safeEnqueue(value);
              }
            } else {
              safeClose();
            }
          } catch (groqError) {
            console.error('Groq fallback also failed:', groqError);
            safeError(groqError);
          }
        }
      },
      cancel() {
        // Client disconnected or cancelled the request mid-stream.
        // Prevent any further writes to the controller.
        // (Note: cancel may race with start() execution.)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // @ts-ignore - scoped vars are in start(), but we still cancel upstream reader here
        reader.cancel().catch(() => {});
      },
    });

    const headers = new Headers(googleResponse.headers);
    headers.set('x-chat-id', currentChatId);

    return new Response(wrappedStream, {
      headers,
      status: googleResponse.status,
      statusText: googleResponse.statusText,
    });
  } catch (error) {
    console.error('Error in booking chat API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}


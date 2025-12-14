# Kestra Workflows

This directory contains Kestra workflow definitions for MedNotes AI automation.

## Workflows

### 1. AI Summary Workflow (`ai_summary_workflow.yml`)

Generates AI-powered consultation summaries and doctor reports based on consultation transcripts and doctor notes.

#### Purpose
When a doctor clicks the "Generate AI Summary" button in the doctor dashboard (`/doctor/[slug]` page), this workflow:
1. Fetches consultation data from Supabase (transcript, doctor notes, appointment notes)
2. Generates an AI summary using OpenAI GPT-4
3. Generates a comprehensive doctor report in Markdown format
4. Updates the consultation record in Supabase with the AI summary
5. Sends the results back to the application via webhook

#### Inputs
- `consultation_id` (STRING, required): The consultation record ID from Supabase
- `callback_url` (STRING, required): Webhook URL to send the results back to the application

#### Variables (Configuration)
Before deploying, update these variables in the workflow file or use Kestra Secrets:
- `supabase_url`: Your Supabase project URL (default: `https://hrwpsmgcgpkplkfxcurj.supabase.co`)
- `supabase_key`: Supabase service role key (move to Kestra Secrets in production)
- `openai_api_key`: OpenAI API key (move to Kestra Secrets in production)
- `webhook_secret_key`: Secret key for webhook authentication

#### Workflow Tasks

1. **fetch_consultation_data**: Retrieves consultation data from Supabase including:
   - Consultation transcript
   - Doctor notes
   - Appointment notes
   - Related appointment information

2. **extract_data**: Python script that extracts and prepares data for AI processing

3. **generate_ai_summary**: Uses OpenAI GPT-4o-mini to generate a structured medical consultation summary including:
   - Chief Complaint
   - Key Symptoms and History
   - Examination Findings
   - Diagnosis/Assessment
   - Treatment Plan
   - Follow-up Recommendations

4. **generate_doctor_report**: Uses OpenAI GPT-4o to create a comprehensive doctor's report in Markdown format with:
   - Patient Information
   - Consultation Date & Time
   - Chief Complaint
   - History of Present Illness (HPI)
   - Physical Examination
   - Assessment & Diagnosis
   - Treatment Plan
   - Investigations Ordered
   - Follow-up Plan
   - Additional Notes

5. **update_consultation_summary**: Updates the Supabase consultation record with the AI summary and sets `processing_status` to `completed`

6. **send_results**: Sends the AI summary and doctor report back to the application via webhook

#### Error Handling
If any task fails:
1. Updates the consultation `processing_status` to `failed` in Supabase
2. Sends an error notification to the callback webhook with error details

#### Triggers
- **Webhook Trigger**: Can be triggered via webhook using the configured secret key

#### Integration with Application

##### Backend Integration (`lib/appointments.ts`)

Update the `generateAISummary` function to trigger the Kestra workflow:

```typescript
export async function generateAISummary(consultationId: string) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, message: 'Not authenticated' };
        }

        // Verify consultation exists and belongs to the doctor
        const { data: consultation, error: consultationError } = await supabase
            .from('consultations')
            .select('id, appointment:appointments(doctor_id)')
            .eq('id', consultationId)
            .single();

        if (consultationError || !consultation) {
            return { success: false, message: 'Consultation not found' };
        }

        const appointment = Array.isArray(consultation.appointment) 
            ? consultation.appointment[0] 
            : consultation.appointment;

        if (appointment.doctor_id !== user.id) {
            return { success: false, message: 'Unauthorized' };
        }

        // Update processing status to 'processing'
        await supabase
            .from('consultations')
            .update({ processing_status: 'processing' })
            .eq('id', consultationId);

        // Trigger Kestra workflow
        const kestraUrl = process.env.KESTRA_URL || 'http://localhost:8080';
        const kestraWebhookKey = process.env.KESTRA_WEBHOOK_KEY || 'jhbjbdjk4654hs';
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/kestra/callback`;

        const response = await fetch(`${kestraUrl}/api/v1/executions/webhook/ai.workflows/ai_summary_workflow/${kestraWebhookKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                consultation_id: consultationId,
                callback_url: callbackUrl,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to trigger Kestra workflow');
        }

        revalidatePath(`/doctor/${consultationId}`);

        return { success: true, message: 'AI Summary generation started' };
    } catch (error: any) {
        console.error('generateAISummary error:', error);
        return { success: false, message: error.message || 'An unexpected error occurred' };
    }
}
```

##### Create Callback API Route (`app/api/kestra/callback/route.ts`)

```typescript
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { consultation_id, ai_summary, doctor_report, status, error } = body;

        if (status === 'completed') {
            // AI summary is already updated by the workflow
            // Optionally store doctor_report in a separate field or document
            console.log('AI Summary completed for consultation:', consultation_id);
            
            // Revalidate the doctor page to show updated data
            const supabase = await createClient();
            const { data: consultation } = await supabase
                .from('consultations')
                .select('appointment_id')
                .eq('id', consultation_id)
                .single();

            if (consultation?.appointment_id) {
                revalidatePath(`/doctor/${consultation.appointment_id}`);
            }
        } else if (status === 'failed') {
            console.error('AI Summary failed for consultation:', consultation_id, error);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

##### Environment Variables

Add these to your `.env.local`:

```env
KESTRA_URL=http://localhost:8080
KESTRA_WEBHOOK_KEY=jhbjbdjk4654hs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

### 1. Deploy to Kestra

```bash
# Using Kestra CLI
kestra flow validate agent/workflow/ai_summary_workflow.yml
kestra flow namespace update ai.workflows agent/workflow/ai_summary_workflow.yml

# Or via Kestra UI
# 1. Open Kestra UI (http://localhost:8080)
# 2. Navigate to Flows
# 3. Create new flow
# 4. Copy and paste the workflow YAML
# 5. Save and deploy
```

### 2. Configure Secrets (Production)

In production, move sensitive credentials to Kestra Secrets:

```bash
# Add secrets via Kestra UI or CLI
kestra secrets create supabase_key "your-supabase-service-role-key" --namespace ai.workflows
kestra secrets create openai_api_key "your-openai-api-key" --namespace ai.workflows
```

Then update the workflow to use secrets:
```yaml
variables:
  supabase_key: "{{ secret('supabase_key') }}"
  openai_api_key: "{{ secret('openai_api_key') }}"
```

### 3. Test the Workflow

```bash
# Trigger via API
curl -X POST "http://localhost:8080/api/v1/executions/webhook/ai.workflows/ai_summary_workflow/jhbjbdjk4654hs" \
  -H "Content-Type: application/json" \
  -d '{
    "consultation_id": "your-consultation-uuid",
    "callback_url": "http://localhost:3000/api/kestra/callback"
  }'
```

## Monitoring

- View workflow executions in Kestra UI: `http://localhost:8080`
- Check execution logs for debugging
- Monitor processing status in Supabase `consultations` table
- Review callback logs in your Next.js application

## Future Enhancements

1. **Audio Transcription Integration**: Combine with `audio_transcription_workflow.yml` for end-to-end processing
2. **Multi-language Support**: Add language detection and translation
3. **Custom Templates**: Allow doctors to define custom report templates
4. **Quality Scoring**: Add AI-based quality assessment of consultations
5. **Batch Processing**: Process multiple consultations in parallel
6. **Notification System**: Send email/SMS notifications to doctors when processing completes


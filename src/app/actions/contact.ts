
'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';

/**
 * Sends a reply to a contact message and updates its status in the database.
 * In a real app, this would also trigger an email to the user.
 * @param messageId The ID of the message to reply to.
 * @param replyContent The content of the reply.
 * @returns An object with either a success flag or an error message.
 */
export async function sendReplyAction(messageId: string, replyContent: string) {
    const supabase = createSupabaseServerClient();
    // In a real app, you'd use a service like Resend or Nodemailer to send an email.
    // For this prototype, we will just update the database and log to console.
    
    const { data: message, error: fetchError } = await supabase
        .from('contact_messages')
        .select('email, name, message')
        .eq('id', messageId)
        .single();
    
    if (fetchError || !message) {
        console.error('Failed to fetch message for reply:', fetchError);
        return { error: 'Failed to fetch original message.' };
    }

    console.log("--- SIMULATING EMAIL ---");
    console.log(`To: ${message.email}`);
    console.log(`Subject: Re: Your inquiry to TeeMart`);
    console.log(`Hi ${message.name},\n\nThank you for contacting us. Here is our response to your message:\n\n---\n\n${replyContent}\n\n---\n\nOriginal message:\n"${message.message}"\n\nRegards,\nThe TeeMart Team`);
    console.log("--- END SIMULATION ---");

    const { error: updateError } = await supabase
        .from('contact_messages')
        .update({
            status: 'replied',
            reply_message: replyContent,
        })
        .eq('id', messageId);

    if (updateError) {
        console.error('Failed to update message status:', updateError);
        return { error: 'Failed to send reply.' };
    }
    
    return { success: true };
}

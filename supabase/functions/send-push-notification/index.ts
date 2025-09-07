// supabase/functions/send-push-notification/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleAuth } from "https://deno.land/x/google_auth@v0.2.2/mod.ts";

const FCM_API_URL = `https://fcm.googleapis.com/v1/projects/${Deno.env.get("FIREBASE_PROJECT_ID")}/messages:send`;

interface PushNotificationPayload {
  recipient_id: string;
  title: string;
  body: string;
  url?: string;
}

// Initialize Google Auth client
const auth = new GoogleAuth({
  scope: ["https://www.googleapis.com/auth/firebase.messaging"],
});

async function getAccessToken() {
  const token = await auth.getAccessToken();
  if (!token) {
    throw new Error("Failed to get Google Auth token.");
  }
  return token;
}

serve(async (req) => {
  // 1. Validate authorization
  const authHeader = req.headers.get("Authorization");
  // Use the new secret name here
  if (!authHeader || authHeader !== `Bearer ${Deno.env.get("SERVICE_ROLE_KEY")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid service role key." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { recipient_id, title, body, url }: PushNotificationPayload = await req.json();
  if (!recipient_id || !title || !body) {
    return new Response(JSON.stringify({ error: "Missing required fields: recipient_id, title, body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Create a Supabase client with the service_role_key to bypass RLS.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SERVICE_ROLE_KEY") ?? "", // Use the new secret name here
    { auth: { persistSession: false } }
  );

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("fcm_tokens")
    .eq("id", recipient_id)
    .single();

  if (profileError || !profile || !profile.fcm_tokens || profile.fcm_tokens.length === 0) {
    const errorMessage = profileError ? profileError.message : "User has no notification tokens.";
    console.warn(`Could not send notification to ${recipient_id}: ${errorMessage}`);
    return new Response(JSON.stringify({ message: `Could not send notification: ${errorMessage}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Get Google Access Token for FCM
  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    console.error("FCM Auth Error:", error.message);
    return new Response(JSON.stringify({ error: "Failed to authenticate with FCM." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Send notifications
  const sendPromises = profile.fcm_tokens.map((token: string) => {
    const message = {
      message: {
        token: token,
        notification: {
          title,
          body,
        },
        webpush: {
          fcm_options: {
            link: url || Deno.env.get("NEXT_PUBLIC_BASE_URL"),
          },
          notification: {
            icon: `${Deno.env.get("NEXT_PUBLIC_BASE_URL") || ''}/logo.png`,
          }
        },
      },
    };

    return fetch(FCM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(message),
    });
  });

  const results = await Promise.allSettled(sendPromises);

  // 5. Process results and handle expired tokens
  const tokensToRemove: string[] = [];
  let successCount = 0;

  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") {
        const response = result.value;
        if (response.ok) {
            successCount++;
        } else {
            const errorBody = await response.json();
            const errorCode = errorBody.error?.details?.[0]?.errorCode;
            if (errorCode === "UNREGISTERED") {
                tokensToRemove.push(profile.fcm_tokens[index]);
            } else {
                 console.error(`FCM send error for token ${profile.fcm_tokens[index]}:`, errorBody);
            }
        }
    } else {
        console.error("FCM Promise Rejected:", result.reason);
    }
  }

  if (tokensToRemove.length > 0) {
    const newTokens = profile.fcm_tokens.filter((t: string) => !tokensToRemove.includes(t));
    await supabase
      .from("profiles")
      .update({ fcm_tokens: newTokens })
      .eq("id", recipient_id);
  }

  // 6. Return response
  if (successCount > 0) {
    return new Response(JSON.stringify({ message: `Successfully sent ${successCount} notifications.` }), {
      headers: { "Content-Type": "application/json" },
    });
  } else {
     return new Response(JSON.stringify({ error: "Failed to send any notifications." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

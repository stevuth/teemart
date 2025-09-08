
-- Drop all previous policies to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations." ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations." ON public.messages;
DROP POLICY IF EXISTS "Users can access their own participation records." ON public.conversation_participants;

-- Enable RLS on all messaging-related tables.
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- ** CONVERSATIONS TABLE POLICIES **

-- A user can see a conversation if they are one of the two participants.
CREATE POLICY "Users can view their own conversations."
ON public.conversations FOR SELECT
USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- A user can't directly insert into conversations. This must be done via the get_or_create_conversation function.
-- By setting the policy to `false`, we block direct inserts from the client.
CREATE POLICY "Users can create conversations."
ON public.conversations FOR INSERT
WITH CHECK (false);


-- ** MESSAGES TABLE POLICIES **

-- A user can see a message if they are a participant in that message's conversation.
CREATE POLICY "Users can view messages in their conversations."
ON public.messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
  )
);

-- A user can send a message if they are the sender and they are a participant in the conversation.
CREATE POLICY "Users can send messages in their conversations."
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (
    SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
  )
);

-- ** CONVERSATION_PARTICIPANTS TABLE POLICIES **

-- A user can see their own participation record. This allows helper queries to work.
CREATE POLICY "Users can access their own participation records."
ON public.conversation_participants FOR SELECT
USING (auth.uid() = user_id);

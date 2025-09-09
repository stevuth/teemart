
-- Function to get the total unread message count for the current user
create or replace function get_unread_message_count()
returns integer
language plpgsql
security definer
as $$
begin
  return (
    select count(*)::integer
    from messages
    where recipient_id = auth.uid() and is_read = false
  );
end;
$$;

-- Grant execute permission to the authenticated role
grant execute on function get_unread_message_count() to authenticated;


-- Function to get an existing conversation or create a new one
create or replace function get_or_create_conversation(
  p_participant_one_id uuid,
  p_participant_two_id uuid
)
returns uuid
language plpgsql
security definer -- Important for creating conversations on behalf of users
as $$
declare
  v_conversation_id uuid;
  v_participant_ids uuid[];
begin
  -- Ensure participants are ordered consistently to avoid duplicate conversations
  if p_participant_one_id < p_participant_two_id then
    v_participant_ids := array[p_participant_one_id, p_participant_two_id];
  else
    v_participant_ids := array[p_participant_two_id, p_participant_one_id];
  end if;

  -- Check if a conversation between these two participants already exists
  select id into v_conversation_id
  from conversations
  where participants = v_participant_ids
  limit 1;

  -- If a conversation is found, return its ID
  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  -- If no conversation is found, create a new one
  insert into conversations (participants)
  values (v_participant_ids)
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

-- Grant execute permission
grant execute on function get_or_create_conversation(uuid, uuid) to authenticated;


-- Function to get all conversations for a specific user
create or replace function get_user_conversations(p_user_id uuid)
returns table (
  id uuid,
  last_message_at timestamptz,
  last_message_content text,
  last_message_sender_id uuid,
  unread_count bigint,
  other_participant jsonb
)
language plpgsql
security definer
as $$
begin
  return query
  with last_messages as (
    select
      conversation_id,
      max(created_at) as last_message_time
    from messages
    group by conversation_id
  )
  select
    c.id,
    lm.last_message_time as last_message_at,
    m.content as last_message_content,
    m.sender_id as last_message_sender_id,
    (
      select count(*)
      from messages msg
      where msg.conversation_id = c.id
        and msg.recipient_id = p_user_id
        and msg.is_read = false
    ) as unread_count,
    (
      select jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      )
      from profiles p
      where p.id = c.participants[
        case
          when c.participants[1] = p_user_id then 2
          else 1
        end
      ]
    ) as other_participant
  from conversations c
  join last_messages lm on c.id = lm.conversation_id
  join messages m on lm.conversation_id = m.conversation_id and lm.last_message_time = m.created_at
  where p_user_id = any(c.participants)
  order by lm.last_message_time desc;
end;
$$;

-- Grant execute permission
grant execute on function get_user_conversations(uuid) to authenticated;


-- Function to mark all messages in a conversation as read for the current user
create or replace function mark_conversation_as_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update messages
  set is_read = true
  where conversation_id = p_conversation_id
    and recipient_id = auth.uid()
    and is_read = false;
end;
$$;

-- Grant execute permission
grant execute on function mark_conversation_as_read(uuid) to authenticated;

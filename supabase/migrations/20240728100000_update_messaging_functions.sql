
-- Drop the function if it exists with a different signature to avoid conflicts
drop function if exists public.get_unread_message_count(p_user_id uuid);

-- Create or replace the function to get unread message count for the current user
create or replace function public.get_unread_message_count()
returns int
language sql
stable
as $$
  select count(*)::int
  from public.messages
  where recipient_id = auth.uid() and is_read = false;
$$;

-- Grant execute permission to the authenticated role
grant execute on function public.get_unread_message_count() to authenticated;
